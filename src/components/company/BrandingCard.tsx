import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Palette, Upload, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateCompany, type Company } from '@/hooks/useCompany';
import { toast } from 'sonner';

interface BrandingCardProps {
  company: Company;
}

const PRESET_COLORS = [
  '#0ea5e9',
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#10b981',
  '#14b8a6',
  '#1f2937',
];

export function BrandingCard({ company }: BrandingCardProps) {
  const { user } = useAuth();
  const updateCompany = useUpdateCompany();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [brandColor, setBrandColor] = useState(company.brand_color || '#6366f1');
  const [brandAvatar, setBrandAvatar] = useState(company.brand_avatar || '');
  const [logoUrl, setLogoUrl] = useState(company.logo_url || '');

  useEffect(() => {
    setBrandColor(company.brand_color || '#6366f1');
    setBrandAvatar(company.brand_avatar || '');
    setLogoUrl(company.logo_url || '');
  }, [company.id, company.brand_color, company.brand_avatar, company.logo_url]);

  const handleSave = async () => {
    await updateCompany.mutateAsync({
      id: company.id,
      brand_color: brandColor,
      brand_avatar: brandAvatar || null,
      logo_url: logoUrl || null,
    });
  };

  const handleLogoUpload = async (file: File) => {
    if (!user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be smaller than 2 MB');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `${user.id}/${company.id}-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('company-logos')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('company-logos').getPublicUrl(path);
      setLogoUrl(data.publicUrl);
      await updateCompany.mutateAsync({ id: company.id, logo_url: data.publicUrl });
    } catch (e) {
      const err = e as Error;
      toast.error('Logo upload failed: ' + err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    setLogoUrl('');
    await updateCompany.mutateAsync({ id: company.id, logo_url: null });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <CardTitle>Workspace Branding</CardTitle>
        </div>
        <CardDescription>
          Customise this company's workspace with a unique colour, avatar and logo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo */}
        <div className="space-y-2">
          <Label>Company Logo</Label>
          <div className="flex items-center gap-4">
            <div
              className="h-20 w-20 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/40 overflow-hidden"
              style={{ borderColor: brandColor }}
            >
              {logoUrl ? (
                <img src={logoUrl} alt="Company logo" className="h-full w-full object-contain" />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleLogoUpload(f);
                }}
              />
              <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Upload logo
              </Button>
              {logoUrl && (
                <Button variant="ghost" size="sm" onClick={handleRemoveLogo}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
              <p className="text-xs text-muted-foreground">PNG, JPG, SVG · max 2 MB</p>
            </div>
          </div>
        </div>

        {/* Brand colour */}
        <div className="space-y-2">
          <Label htmlFor="brand_color">Brand Colour</Label>
          <div className="flex items-center gap-3">
            <Input
              id="brand_color"
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="h-10 w-16 p-1 cursor-pointer"
            />
            <Input
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              placeholder="#6366f1"
              className="max-w-xs font-mono"
            />
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setBrandColor(c)}
                className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                  brandColor.toLowerCase() === c ? 'border-foreground' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Use ${c}`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Used for buttons, highlights and the sidebar across this company's workspace.
          </p>
        </div>

        {/* Avatar */}
        <div className="space-y-2">
          <Label htmlFor="brand_avatar">Workspace Avatar</Label>
          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-lg flex items-center justify-center text-white text-lg font-bold"
              style={{ backgroundColor: brandColor }}
            >
              {brandAvatar || company.name.charAt(0).toUpperCase()}
            </div>
            <Input
              id="brand_avatar"
              value={brandAvatar}
              onChange={(e) => setBrandAvatar(e.target.value.slice(0, 2))}
              placeholder="e.g. AC or 🚀"
              maxLength={2}
              className="max-w-xs"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            1–2 characters or an emoji. Defaults to the first letter of the company name.
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateCompany.isPending}>
            {updateCompany.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Save branding
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
