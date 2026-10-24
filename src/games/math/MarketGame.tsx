"use client";
import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui";
import { sound } from "@/lib/audio";
import { COINS, marketTasks, priceLabel, type Coin, type MarketTask } from "@/lib/math/games";
import type { GameProps } from "../types";
import { Choices, MathShell, type MathApi } from "./MathShell";
import { useMathTasks } from "./useMath";

const SHORT: Record<number, string> = { 1: "قرش", 5: "٥ قروش", 10: "١٠ قروش", 25: "ربع دينار", 50: "نصف دينار", 100: "دينار" };

/**
 * Simplified drawing of a Jordanian coin: real denomination, shape (the quarter
 * dinar is seven-sided) and metal colour; not a reproduction of the coin design.
 */
export function CoinIcon({ coin, size = 72 }: { coin: Coin; size?: number }) {
  const fill = coin.metal === "copper" ? "#D9A066" : coin.metal === "nickel" ? "#CED4DA" : "#CED4DA";
  const hept = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
    return `${50 + Math.cos(a) * 46},${50 + Math.sin(a) * 46}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={coin.name}>
      {coin.shape === "heptagon" ? <polygon points={hept} fill={fill} stroke="#8D5B2A" strokeWidth="4" /> : <circle cx="50" cy="50" r="46" fill={fill} stroke={coin.metal === "copper" ? "#8D5B2A" : "#868E96"} strokeWidth="4" />}
      {coin.metal === "bimetal" && <circle cx="50" cy="50" r="30" fill="#D9A066" stroke="#8D5B2A" strokeWidth="2" />}
      <text x="50" y="56" textAnchor="middle" fontSize={SHORT[coin.value].length > 6 ? 15 : 20} fontWeight="800" fontFamily="Cairo, sans-serif" fill="#25304B">
        {SHORT[coin.value]}
      </text>
    </svg>
  );
}
const coinOf = (v: number) => COINS.find((c) => c.value === v)!;

export default function MarketGame({ game, paused, onFinish }: GameProps) {
  const tasks = useMathTasks(game, marketTasks);
  return (
    <MathShell
      game={game}
      paused={paused}
      onFinish={onFinish}
      tasks={tasks}
      prompt={(t, fmt) => {
        const money = (n: number) => priceLabel(n, (v) => fmt(v));
        if (t.kind === "pay") return `اشترِ ${t.product.name} وادفع ثمنه: ${money(t.price)}`;
        if (t.kind === "change") return `اشتريت ${t.product.name} بـ${money(t.price)} ودفعت ${money(t.paid)}. كم الباقي؟`;
        if (t.kind === "sum") return `اشتريت ${t.products[0].name} و${t.products[1].name}. كم تدفع؟`;
        return `كم قطعة من فئة «${coinOf(t.small).name}» تساوي «${coinOf(t.big).name}»؟`;
      }}
      skill={(t) => `money-${t.kind}`}
      hint={(t) =>
        t.kind === "pay"
          ? "ابدأ بالقطع الكبيرة، ثم أكمل بالقطع الصغيرة حتى يساوي المجموع السعر."
          : t.kind === "change"
            ? "الباقي = المبلغ المدفوع − السعر. الدينار = ١٠٠ قرش."
            : t.kind === "sum"
              ? "اجمع السعرين. إذا زاد المجموع على ١٠٠ قرش فهو دينار وقروش."
              : "الدينار = ١٠٠ قرش، نصف الدينار = ٥٠ قرشًا، ربع الدينار = ٢٥ قرشًا."
      }
    >
      {(t, api) => (t.kind === "pay" ? <Pay t={t} api={api} /> : t.kind === "equal" ? <EqualCoins t={t} api={api} /> : <MoneyAnswer t={t} api={api} />)}
    </MathShell>
  );
}

function Pay({ t, api }: { t: Extract<MarketTask, { kind: "pay" }>; api: MathApi }) {
  const [tray, setTray] = useState<number[]>([]);
  const total = tray.reduce((a, b) => a + b, 0);
  return (
    <div className="flex size-full flex-col items-center gap-4 p-4 md:flex-row md:items-start md:justify-center" data-testid="market-pay">
      <div className="flex flex-col items-center gap-2 rounded-[2rem] bg-white p-6 shadow-soft">
        <span className="text-[7rem] leading-none" aria-hidden>{t.product.emoji}</span>
        <span className="font-display text-2xl font-bold">{t.product.name}</span>
        <span className="rounded-full bg-hero-yellow px-5 py-2 font-display text-2xl font-extrabold" data-testid="market-price" data-price={t.price}>🏷️ {priceLabel(t.price, (n) => api.fmt(n))}</span>
      </div>
      <div className="flex w-full max-w-xl flex-col gap-3">
        <p className="font-display text-lg font-bold">المحفظة: اضغط على القطع لتدفع</p>
        <div className="flex flex-wrap gap-3 rounded-3xl bg-[#FFF4E6] p-3" aria-label="المحفظة">
          {t.coins.map((v) => (
            <motion.button key={v} type="button" whileTap={{ scale: 0.9 }} disabled={api.locked} onClick={() => { sound.play("click"); setTray((x) => [...x, v]); }} className="cursor-pointer rounded-full" data-testid="market-coin" data-value={v}>
              <CoinIcon coin={coinOf(v)} size={84} />
            </motion.button>
          ))}
        </div>
        <p className="font-display text-lg font-bold">صينية الدفع (اضغط على قطعة لإعادتها)</p>
        <div className="flex min-h-24 flex-wrap gap-2 rounded-3xl border-4 border-dashed border-hero-ink/20 bg-white p-3" aria-label="صينية الدفع">
          {tray.map((v, i) => (
            <motion.button key={i} type="button" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={() => setTray((x) => x.filter((_, k) => k !== i))} disabled={api.locked} className="cursor-pointer" data-testid="market-tray-coin">
              <CoinIcon coin={coinOf(v)} size={56} />
            </motion.button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="font-display text-2xl font-extrabold" data-testid="market-total">المجموع: {total === 0 ? api.fmt(0) : priceLabel(total, (n) => api.fmt(n))}</span>
          <Button size="lg" variant="success" disabled={api.locked || total === 0} onClick={() => api.submit(total === t.price, total === t.price ? "تمّ الشراء! شكرًا لك 🛍️" : total < t.price ? "المبلغ أقل من السعر!" : "المبلغ أكثر من السعر!")}>
            ادفع
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Change and total-price tasks: the goods, their prices, and money answers to choose from. */
function MoneyAnswer({ t, api }: { t: Extract<MarketTask, { kind: "change" | "sum" }>; api: MathApi }) {
  const money = (n: number) => priceLabel(n, (v) => api.fmt(v));
  const goods = t.kind === "change" ? [{ product: t.product, price: t.price }] : t.products.map((product, k) => ({ product, price: t.prices[k] }));
  return (
    <div className="flex size-full flex-col items-center justify-center gap-5 p-4" data-testid={`market-${t.kind}`}>
      <div className="flex flex-wrap items-center justify-center gap-4">
        {goods.map((g, k) => (
          <div key={k} className="flex flex-col items-center gap-1 rounded-[2rem] bg-white p-4 shadow-soft">
            <span className="text-7xl leading-none" aria-hidden>{g.product.emoji}</span>
            <span className="font-display text-xl font-bold">{g.product.name}</span>
            <span className="rounded-full bg-hero-yellow px-4 py-1 font-display text-xl font-extrabold">🏷️ {money(g.price)}</span>
          </div>
        ))}
        {t.kind === "change" && (
          <div className="flex flex-col items-center gap-1">
            <span className="font-bold">دفعت:</span>
            <div className="flex gap-1">{Array.from({ length: t.paid / 100 }, (_, k) => <CoinIcon key={k} coin={coinOf(100)} size={80} />)}</div>
          </div>
        )}
      </div>
      <Choices options={t.choices} answer={t.answer} api={api} className="w-full max-w-4xl" render={(c) => <span className="text-2xl md:text-3xl">{money(c)}</span>} />
    </div>
  );
}

function EqualCoins({ t, api }: { t: Extract<MarketTask, { kind: "equal" }>; api: MathApi }) {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-5 p-4" data-testid="market-equal">
      <div className="flex items-center gap-4">
        <CoinIcon coin={coinOf(t.big)} size={120} />
        <span className="font-display text-5xl font-extrabold">=</span>
        <span className="font-display text-5xl font-extrabold">؟ ×</span>
        <CoinIcon coin={coinOf(t.small)} size={90} />
      </div>
      <Choices options={t.choices} answer={t.answer} api={api} className="w-full max-w-3xl" render={(c) => api.fmt(c)} />
    </div>
  );
}
