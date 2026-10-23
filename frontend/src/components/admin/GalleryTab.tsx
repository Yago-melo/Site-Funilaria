import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Film, ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiDelete, apiUpload, errorMessage } from "@/lib/api";
import { useGallery } from "@/lib/hooks";
import { queryClient } from "@/lib/queryClient";
import type { GalleryItem } from "@/lib/types";

export default function GalleryTab() {
  const { data, isError, isLoading } = useGallery();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Martelinho de Ouro");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [before, setBefore] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const beforeRef = useRef<HTMLInputElement>(null);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["gallery"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  const upload = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append("file", file as File);
      if (before) fd.append("before", before);
      fd.append("title", title);
      fd.append("category", category);
      fd.append("description", description);
      return apiUpload<GalleryItem>("/admin/gallery", fd);
    },
    onSuccess: () => {
      toast.success("Trabalho publicado na galeria!");
      setTitle(""); setDescription(""); setFile(null); setBefore(null);
      if (fileRef.current) fileRef.current.value = "";
      if (beforeRef.current) beforeRef.current.value = "";
      refresh();
    },
    onError: (err) => toast.error(errorMessage(err, "Falha no envio do arquivo.")),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete<{ ok: boolean }>(`/admin/gallery/${id}`),
    onSuccess: () => { toast.success("Item removido."); refresh(); },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const isVideo = file?.type.startsWith("video/");
  const items = isError ? [] : (data ?? []);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-12">
      <form
        onSubmit={(e) => { e.preventDefault(); if (file && title.trim()) upload.mutate(); }}
        className="space-y-4 rounded-xl border border-line bg-panel p-6 lg:sticky lg:top-24 lg:col-span-4"
        data-testid="admin-gallery-upload-form"
      >
        <h2 className="font-heading text-lg font-semibold text-white">Publicar novo trabalho</h2>
        <div className="space-y-2">
          <Label htmlFor="g-file">Foto ou vídeo *</Label>
          <Input id="g-file" ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" onChange={(e) => setFile(e.target.files?.[0] ?? null)} data-testid="admin-gallery-file-input" />
          <p className="text-xs text-neutral-500">JPG, PNG, WEBP, MP4, MOV ou WEBM — até 150MB.</p>
        </div>
        {!isVideo && (
          <div className="space-y-2">
            <Label htmlFor="g-before">Foto do "antes" (opcional)</Label>
            <Input id="g-before" ref={beforeRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setBefore(e.target.files?.[0] ?? null)} data-testid="admin-gallery-before-input" />
            <p className="text-xs text-neutral-500">Cria um comparativo arrastável de antes e depois.</p>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="g-title">Título *</Label>
          <Input id="g-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Porta do Corolla sem repintura" data-testid="admin-gallery-title-input" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="g-cat">Categoria</Label>
          <Input id="g-cat" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Porta, Capô, Granizo..." data-testid="admin-gallery-category-input" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="g-desc">Descrição</Label>
          <Textarea id="g-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} data-testid="admin-gallery-description-input" />
        </div>
        <Button type="submit" className="h-10 w-full font-semibold" disabled={!file || !title.trim() || upload.isPending} data-testid="admin-gallery-upload-button">
          {upload.isPending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {upload.isPending ? "Enviando..." : "Publicar"}
        </Button>
      </form>

      <div className="lg:col-span-8">
        {isLoading ? (
          <div className="flex items-center gap-2 text-neutral-400"><Loader2 className="size-4 animate-spin" /> Carregando galeria...</div>
        ) : items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-10 text-neutral-400" data-testid="admin-gallery-empty">Nenhum trabalho publicado ainda.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" data-testid="admin-gallery-list">
            {items.map((it) => (
              <div key={it.id} className="group overflow-hidden rounded-xl border border-line bg-panel" data-testid={`admin-gallery-item-${it.id}`}>
                <div className="relative aspect-video bg-black">
                  {it.type === "video" ? (
                    <video src={it.media_url} muted preload="metadata" controls className="size-full object-cover" />
                  ) : (
                    <img src={it.media_url} alt={it.title} className="size-full object-cover" loading="lazy" />
                  )}
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-black/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-white">
                    {it.type === "video" ? <Film className="size-3" /> : <ImageIcon className="size-3" />}
                    {it.type === "video" ? "Vídeo" : it.before_url ? "Antes/Depois" : "Foto"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium text-white">{it.title}</p>
                    <p className="text-xs text-amber-400/90">{it.category}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remover ${it.title}`}
                    onClick={() => { if (window.confirm("Remover este item da galeria?")) remove.mutate(it.id); }}
                    className="text-neutral-400 hover:text-red-400"
                    data-testid={`admin-gallery-delete-${it.id}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
