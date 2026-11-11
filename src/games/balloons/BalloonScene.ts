import type Phaser from "phaser";

export interface BalloonQuestion {
  choices: string[];
  correctIndex: number;
  rtl: boolean;
}

export interface BalloonCallbacks {
  onPick: (index: number) => void;
}

const COLORS = [0xff6b9a, 0x4361ee, 0x40c057, 0xff922b, 0x7950f2, 0x20a4c9];

/**
 * Builds the Phaser scene class lazily (Phaser must only load in the browser).
 * The scene draws floating balloons; React owns the game rules and tells the
 * scene which question to show and how to react to answers.
 */
export function createBalloonScene(P: typeof Phaser, cb: BalloonCallbacks, reduced: () => boolean) {
  return class BalloonScene extends P.Scene {
    private balloons: Phaser.GameObjects.Container[] = [];
    private clouds: Phaser.GameObjects.Graphics[] = [];
    private sky!: Phaser.GameObjects.Graphics;
    private current: BalloonQuestion | null = null;
    private locked = false;

    constructor() {
      super("balloons");
    }

    create() {
      this.sky = this.add.graphics();
      this.drawSky();
      for (let i = 0; i < 5; i++) {
        const g = this.add.graphics();
        g.fillStyle(0xffffff, 0.85);
        g.fillCircle(0, 0, 34);
        g.fillCircle(38, 6, 28);
        g.fillCircle(-36, 8, 24);
        g.fillCircle(8, 16, 30);
        g.setPosition(P.Math.Between(0, this.scale.width), P.Math.Between(40, this.scale.height * 0.5));
        g.setScale(0.6 + Math.random() * 0.8);
        g.setAlpha(0.7);
        this.clouds.push(g);
      }
      // Particle texture for the pop burst.
      const t = this.add.graphics();
      t.fillStyle(0xffffff, 1);
      t.fillCircle(8, 8, 8);
      t.generateTexture("dot", 16, 16);
      t.destroy();

      this.scale.on("resize", () => {
        this.drawSky();
        this.layout(false);
      });
      this.game.events.emit("scene-ready");
    }

    update(_: number, delta: number) {
      const speed = reduced() ? 0 : delta * 0.012;
      for (const c of this.clouds) {
        c.x -= speed * c.scale;
        if (c.x < -120) c.x = this.scale.width + 120;
      }
    }

    private drawSky() {
      const { width, height } = this.scale;
      this.sky.clear();
      this.sky.fillGradientStyle(0x74c0fc, 0x74c0fc, 0xe7f5ff, 0xe7f5ff, 1);
      this.sky.fillRect(0, 0, width, height);
      this.sky.fillStyle(0x8ce99a, 1);
      this.sky.fillEllipse(width * 0.25, height + 30, width * 0.9, 160);
      this.sky.fillStyle(0x69db7c, 1);
      this.sky.fillEllipse(width * 0.8, height + 40, width * 0.9, 180);
    }

    private slot(i: number, n: number) {
      const { width, height } = this.scale;
      const cols = n;
      // RTL: the first choice sits on the right.
      const x = width - (width / cols) * (i + 0.5);
      const y = height * (n > 2 ? (i % 2 ? 0.58 : 0.5) : 0.54);
      return { x, y };
    }

    private balloonSize(n: number) {
      const { width, height } = this.scale;
      return Math.max(46, Math.min(width / (n * 2.3), height * 0.2, 120));
    }

    showQuestion(q: BalloonQuestion) {
      this.current = q;
      this.locked = false;
      for (const b of this.balloons) b.destroy();
      this.balloons = q.choices.map((choice, i) => this.makeBalloon(choice, i, q.choices.length, q.rtl));
      this.layout(true);
    }

    private makeBalloon(text: string, index: number, n: number, rtl: boolean) {
      const r = this.balloonSize(n);
      const color = COLORS[(index + Math.floor(Math.random() * 2) * 2) % COLORS.length];
      const c = this.add.container(0, 0);
      const g = this.add.graphics();
      // string
      g.lineStyle(3, 0x25304b, 0.6);
      g.beginPath();
      g.moveTo(0, r * 1.15);
      g.lineTo(-6, r * 1.6);
      g.lineTo(4, r * 2.1);
      g.strokePath();
      // body
      g.fillStyle(color, 1);
      g.fillEllipse(0, 0, r * 2, r * 2.3);
      g.fillTriangle(-9, r * 1.12, 9, r * 1.12, 0, r * 1.26);
      g.fillStyle(0xffffff, 0.35);
      g.fillEllipse(-r * 0.42, -r * 0.5, r * 0.4, r * 0.7);
      const label = this.add
        .text(0, -r * 0.05, text, {
          fontFamily: "Cairo, Tajawal, sans-serif",
          fontStyle: "800",
          fontSize: `${Math.round(r * (text.length > 8 ? 0.32 : text.length > 4 ? 0.44 : 0.62))}px`,
          color: "#ffffff",
          align: "center",
          rtl,
          wordWrap: { width: r * 1.7, useAdvancedWrap: true },
          stroke: "#25304b",
          strokeThickness: Math.max(3, r * 0.06),
        })
        .setOrigin(0.5);
      c.add([g, label]);
      c.setSize(r * 2, r * 2.3);
      c.setData({ index, r, color });
      // Container hit areas are measured from the top-left of its size box, so centre the ellipse there.
      c.setInteractive({ useHandCursor: true, hitArea: new P.Geom.Ellipse(r, r * 1.15, r * 2.2, r * 2.5), hitAreaCallback: P.Geom.Ellipse.Contains });
      c.on("pointerdown", () => {
        if (this.locked || !c.active) return;
        cb.onPick(index);
      });
      c.on("pointerover", () => !this.locked && this.tweens.add({ targets: c, scale: 1.08, duration: 150 }));
      c.on("pointerout", () => this.tweens.add({ targets: c, scale: 1, duration: 150 }));
      return c;
    }

    private layout(entering: boolean) {
      const n = this.balloons.length;
      this.balloons.forEach((b, i) => {
        if (!b.active) return;
        const { x, y } = this.slot(i, n);
        this.tweens.killTweensOf(b);
        if (entering && !reduced()) {
          b.setPosition(x, this.scale.height + 200);
          this.tweens.add({ targets: b, y, duration: 900 + i * 120, ease: "Back.Out", delay: i * 90, onComplete: () => this.bob(b, x, y) });
        } else {
          b.setPosition(x, y);
          this.bob(b, x, y);
        }
      });
    }

    private bob(b: Phaser.GameObjects.Container, x: number, y: number) {
      if (reduced() || !b.active) return;
      const amp = 10 + Math.random() * 8;
      this.tweens.add({ targets: b, y: y - amp, duration: 1500 + Math.random() * 900, yoyo: true, repeat: -1, ease: "Sine.InOut" });
      this.tweens.add({ targets: b, x: x + (Math.random() < 0.5 ? -1 : 1) * (6 + Math.random() * 8), duration: 2100 + Math.random() * 900, yoyo: true, repeat: -1, ease: "Sine.InOut" });
      this.tweens.add({ targets: b, angle: { from: -4, to: 4 }, duration: 1800 + Math.random() * 800, yoyo: true, repeat: -1, ease: "Sine.InOut" });
    }

    /** Correct pick: confetti-like burst and the balloon disappears. */
    pop(index: number) {
      this.locked = true;
      const b = this.balloons[index];
      if (!b) return;
      const color = b.getData("color") as number;
      if (!reduced()) {
        const emitter = this.add.particles(b.x, b.y, "dot", {
          speed: { min: 180, max: 520 },
          scale: { start: 0.9, end: 0 },
          lifespan: 900,
          gravityY: 600,
          tint: [color, 0xffd43b, 0xffffff, 0x40c057],
          emitting: false,
        });
        emitter.explode(46);
        this.time.delayedCall(1200, () => emitter.destroy());
        this.cameras.main.shake(140, 0.004);
      }
      this.tweens.killTweensOf(b);
      this.tweens.add({ targets: b, scale: 1.35, alpha: 0, duration: 140, onComplete: () => b.setVisible(false) });
      // The other balloons float away.
      this.balloons.forEach((o, i) => {
        if (i === index) return;
        this.tweens.killTweensOf(o);
        this.tweens.add({ targets: o, y: -250, duration: reduced() ? 10 : 1100, delay: 250 + i * 60, ease: "Quad.In" });
      });
    }

    /** Wrong pick: the balloon shakes, shrinks and deflates. */
    deflate(index: number) {
      const b = this.balloons[index];
      if (!b) return;
      b.disableInteractive();
      this.tweens.killTweensOf(b);
      this.tweens.add({ targets: b, x: b.x + 14, duration: 60, yoyo: true, repeat: 3 });
      this.tweens.add({ targets: b, scale: 0.55, alpha: 0.35, y: this.scale.height * 0.85, angle: 25, delay: 260, duration: 700, ease: "Quad.In" });
    }

    /** Time up: highlight the right balloon. */
    reveal(index: number) {
      this.locked = true;
      const b = this.balloons[index];
      if (!b) return;
      this.tweens.add({ targets: b, scale: 1.25, duration: 300, yoyo: true, repeat: 2 });
      this.balloons.forEach((o, i) => i !== index && this.tweens.add({ targets: o, alpha: 0.3, duration: 300 }));
    }
  };
}
