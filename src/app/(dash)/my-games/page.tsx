"use client";
import Link from "next/link";
import { Copy, Download, Pencil, Play, Plus, Search, Trash2, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { HeroKid } from "@/components/Characters";
import { GameArt } from "@/components/GameArt";
import { customizeHref, playHref, questionCount } from "@/components/GameCard";
import { toast } from "@/components/Toast";
import { Badge, Button, ConfirmDialog, EmptyState, IconButton, Loading, PageHeader, inputClass } from "@/components/ui";
import { gameMetaFor, gradeLabel, subjectLabel } from "@/lib/constants";
import { gameToFile, parseGameFile } from "@/lib/transfer";
import type { GameConfig } from "@/lib/types";
import { downloadJSON, readFileAsText } from "@/lib/utils";
import { useData } from "@/store/data";

export default function MyGamesPage() {
  const { games, ready, deleteGame, duplicateGame, saveGame } = useData();
  const [query, setQuery] = useState("");
  const [toDelete, setToDelete] = useState<GameConfig | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const list = useMemo(() => {
    const q = query.trim();
    return q ? games.filter((g) => g.title.includes(q) || g.lesson.includes(q) || gameMetaFor(g.type, g.subject).name.includes(q)) : games;
  }, [games, query]);

  const importGame = async (file: File) => {
    try {
      const game = parseGameFile(JSON.parse(await readFileAsText(file)));
      await saveGame(game);
      toast(`تم استيراد «${game.title}»`);
    } catch (e) {
      toast(e instanceof Error && e.message.length < 80 ? e.message : "تعذّر قراءة الملف", "error");
    }
  };

  return (
    <div>
      <PageHeader
        title="ألعابي المحفوظة"
        subtitle="كل الألعاب التي أنشأتها أو خصصتها. تُحفظ تلقائيًا على هذا الجهاز."
        actions={
          <>
            <Button variant="secondary" icon={<Upload className="size-5" />} onClick={() => fileRef.current?.click()}>
              استيراد لعبة
            </Button>
            <Link href="/create" className="btn-3d inline-flex min-h-12 items-center gap-2 rounded-2xl bg-hero-blue px-5 font-display text-lg font-bold text-white">
              <Plus className="size-5" /> لعبة جديدة
            </Link>
          </>
        }
      />
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        data-testid="import-game-input"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void importGame(f);
          e.target.value = "";
        }}
      />
      {!ready ? (
        <Loading />
      ) : games.length === 0 ? (
        <EmptyState
          art={<HeroKid size={120} />}
          title="لم تنشئ أي لعبة بعد"
          hint="أنشئ لعبتك الأولى في دقائق، أو خصّص لعبة جاهزة من المكتبة."
          action={
            <Link href="/create" className="btn-3d mt-2 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-hero-blue px-6 font-display text-lg font-bold text-white">
              <Plus className="size-5" /> أنشئ لعبة
            </Link>
          }
        />
      ) : (
        <>
          <div className="relative mb-5">
            <Search className="absolute start-4 top-1/2 size-5 -translate-y-1/2 text-hero-muted" />
            <input className={`${inputClass} ps-12`} placeholder="ابحث في ألعابي..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          {list.length === 0 && <EmptyState title="لا توجد نتائج" hint="لا توجد لعبة بهذا الاسم." />}
          <ul className="flex flex-col gap-3">
            {list.map((g) => (
              <li key={g.id} className="flex flex-wrap items-center gap-4 rounded-3xl bg-white p-3 shadow-soft">
                <GameArt type={g.type} className="h-20 w-32 shrink-0 rounded-2xl" />
                <div className="min-w-48 flex-1">
                  <h3 className="text-xl font-extrabold">{g.title}</h3>
                  <p className="text-hero-muted">
                    {gameMetaFor(g.type, g.subject).name} • {gradeLabel(g.grade)} • {subjectLabel(g.subject)} • {questionCount(g)} سؤالًا
                  </p>
                  <Badge color="#868E96" className="mt-1">آخر تعديل: {new Date(g.updatedAt).toLocaleDateString("ar")}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={playHref(g.id)} className="btn-3d inline-flex min-h-12 items-center gap-2 rounded-2xl bg-hero-green px-5 font-display text-lg font-bold text-white">
                    <Play className="size-5 fill-current" /> العب
                  </Link>
                  <Link href={customizeHref(g)} aria-label="تعديل" title="تعديل" className="grid size-12 place-items-center rounded-2xl bg-hero-ink/5 hover:bg-hero-ink/10">
                    <Pencil className="size-5" />
                  </Link>
                  <IconButton label="نسخ اللعبة" className="bg-hero-ink/5 shadow-none" onClick={async () => { await duplicateGame(g.id); toast("تم إنشاء نسخة"); }}>
                    <Copy className="size-5" />
                  </IconButton>
                  <IconButton label="تصدير اللعبة" className="bg-hero-ink/5 shadow-none" onClick={() => downloadJSON(`heroes-world-game-${g.id}.json`, gameToFile(g))}>
                    <Download className="size-5" />
                  </IconButton>
                  <IconButton label="حذف اللعبة" className="bg-hero-red/10 text-hero-red shadow-none" onClick={() => setToDelete(g)}>
                    <Trash2 className="size-5" />
                  </IconButton>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      <ConfirmDialog
        open={!!toDelete}
        title="حذف اللعبة؟"
        message={`سيتم حذف «${toDelete?.title ?? ""}» نهائيًا من هذا الجهاز.`}
        confirmLabel="حذف"
        danger
        onCancel={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) await deleteGame(toDelete.id);
          setToDelete(null);
          toast("تم حذف اللعبة", "info");
        }}
      />
    </div>
  );
}
