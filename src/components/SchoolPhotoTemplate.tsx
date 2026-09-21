import React from 'react';
import { Instagram, Sparkles, CheckCircle, GraduationCap } from 'lucide-react';
import { School } from '../types';

interface SchoolPhotoTemplateProps {
  photoUrl: string;
  school: School;
  studentName?: string;
  studentInstagram?: string;
  gradYear?: number | string;
  major?: string;
  hometown?: string;
  templateStyle?: 'collegiate' | 'modern' | 'badge';
  className?: string;
  showWatermark?: boolean;
}

export const getSchoolIgTag = (school: School): string => {
  if (school.instagramHandle && school.instagramHandle !== 'no username') {
    return school.instagramHandle.startsWith('@')
      ? school.instagramHandle
      : `@${school.instagramHandle}`;
  }
  const cleanShort = school.shortName.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `@${cleanShort}2031class`;
};

export const SchoolPhotoTemplate: React.FC<SchoolPhotoTemplateProps> = ({
  photoUrl,
  school,
  studentName,
  studentInstagram,
  gradYear = 2031,
  major,
  hometown,
  templateStyle = 'collegiate',
  className = '',
  showWatermark = true,
}) => {
  const schoolIgTag = getSchoolIgTag(school);
  const cleanStudentIg = studentInstagram
    ? studentInstagram.replace('@', '').trim()
    : '';

  // Theme color with fallbacks
  const accentColor = school.accentColor || '#3B82F6';
  const gradYearShort = String(gradYear).slice(-2);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl shadow-xl select-none group ${className}`}
      style={{
        boxShadow: `0 14px 38px -10px ${accentColor}35, 0 6px 18px -4px rgba(0,0,0,0.25)`,
      }}
    >
      {/* Outer Collegiate Frame Border in School Accent Color */}
      <div
        className="absolute inset-0 z-20 pointer-events-none rounded-2xl border-4"
        style={{ borderColor: accentColor }}
      />

      {/* The Actual User Photo */}
      <img
        src={photoUrl}
        alt={studentName || `${school.shortName} student`}
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
      />

      {/* TOP OVERLAY: Student's IG Tag + School Class Header */}
      <div className="absolute top-0 inset-x-0 z-30 p-2.5 sm:p-3 bg-gradient-to-b from-black/85 via-black/50 to-transparent">
        <div className="flex items-center justify-between gap-2">
          {/* Top Left: Student's Instagram Tag */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 shadow-md">
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: accentColor }}
            >
              <Instagram className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-white tracking-wide truncate max-w-[130px] sm:max-w-[170px]">
              {cleanStudentIg ? `@${cleanStudentIg}` : '@your_handle'}
            </span>
          </div>

          {/* Top Right: University Class of '31 Badge in School Theme Colors */}
          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-white font-extrabold text-[10px] sm:text-xs shadow-md border border-white/25"
            style={{ backgroundColor: accentColor }}
          >
            <GraduationCap className="w-3 h-3 shrink-0" />
            <span>
              {school.shortName} &apos;{gradYearShort}
            </span>
          </div>
        </div>

        {/* Optional Academic Strip if provided */}
        {(major || hometown) && (
          <div className="mt-1.5 flex items-center gap-1.5 overflow-hidden">
            {major && (
              <span className="inline-block px-2 py-0.5 rounded-md bg-white/15 backdrop-blur-xs text-[10px] font-medium text-white/90 truncate max-w-[180px]">
                {major}
              </span>
            )}
            {hometown && (
              <span className="inline-block px-2 py-0.5 rounded-md bg-white/15 backdrop-blur-xs text-[10px] font-medium text-white/90 truncate">
                📍 {hometown}
              </span>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM OVERLAY: School's Official Instagram Tag & Campus Branding */}
      <div className="absolute bottom-0 inset-x-0 z-30 p-3 sm:p-3.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
        {/* Themed Banner Bar */}
        <div
          className="p-2 sm:p-2.5 rounded-xl text-white shadow-lg border border-white/15 backdrop-blur-md flex items-center justify-between gap-2"
          style={{
            background: `linear-gradient(135deg, ${accentColor}F0 0%, ${accentColor}C0 60%, #111827E6 100%)`,
          }}
        >
          <div className="min-w-0 flex items-center gap-2">
            {/* School Initial Icon */}
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/20 border border-white/30 flex items-center justify-center font-black text-xs text-white shrink-0">
              {school.shortName.slice(0, 2).toUpperCase()}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[11px] sm:text-xs font-black tracking-tight text-white truncate">
                  {schoolIgTag}
                </span>
                <CheckCircle className="w-3 h-3 text-sky-300 fill-sky-400/30 shrink-0" />
              </div>
              <p className="text-[9px] sm:text-[10px] text-white/80 font-medium truncate">
                Official {school.shortName} Campus Feature
              </p>
            </div>
          </div>

          {/* Commitment Stamp */}
          <div className="shrink-0 flex items-center gap-1 bg-white/20 px-2 py-1 rounded-lg text-[9px] sm:text-[10px] font-bold text-white border border-white/20">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>COMMITTED</span>
          </div>
        </div>

        {showWatermark && (
          <div className="flex items-center justify-between text-[9px] text-white/70 px-1 pt-1.5 font-medium">
            <span>meetfutureclass.com</span>
            <span>#{school.shortName.replace(/[^a-zA-Z0-9]/g, '')}2031</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Canvas Generator: Bakes the custom template onto a high-resolution canvas so the user can download or store the templated photo!
export const generateTemplatedCanvas = async (
  imageSrc: string,
  school: School,
  studentInstagram: string,
  gradYear: number | string = 2031,
  major?: string,
  hometown?: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const targetW = 1080;
        const targetH = 1350; // Standard 4:5 Instagram Portrait
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageSrc);
          return;
        }

        // Draw background image scaled to fill 4:5
        const scale = Math.max(targetW / img.width, targetH / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        const dx = (targetW - dw) / 2;
        const dy = (targetH - dh) / 2;
        ctx.drawImage(img, dx, dy, dw, dh);

        const accentColor = school.accentColor || '#3B82F6';
        const schoolIg = getSchoolIgTag(school);
        const studentIg = studentInstagram
          ? studentInstagram.startsWith('@')
            ? studentInstagram
            : `@${studentInstagram}`
          : '@your_handle';

        // 1. Outer Border
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 24;
        ctx.strokeRect(12, 12, targetW - 24, targetH - 24);

        // 2. Top Scrim Gradient
        const topGrad = ctx.createLinearGradient(0, 0, 0, 320);
        topGrad.addColorStop(0, 'rgba(0,0,0,0.88)');
        topGrad.addColorStop(0.6, 'rgba(0,0,0,0.45)');
        topGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, targetW, 320);

        // 3. Top Student IG Pill
        const pillX = 40;
        const pillY = 44;
        const pillH = 68;
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, 380, pillH, 20);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Student IG Text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
        ctx.fillText(studentIg, pillX + 24, pillY + 46);
        ctx.restore();

        // 4. Top Right School Class Badge
        const badgeW = 260;
        const badgeX = targetW - badgeW - 40;
        ctx.save();
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.roundRect(badgeX, pillY, badgeW, pillH, 20);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 28px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${school.shortName} '31`, badgeX + badgeW / 2, pillY + 46);
        ctx.restore();

        // 5. Bottom Scrim Gradient
        const botGrad = ctx.createLinearGradient(0, targetH - 360, 0, targetH);
        botGrad.addColorStop(0, 'rgba(0,0,0,0)');
        botGrad.addColorStop(0.4, 'rgba(0,0,0,0.65)');
        botGrad.addColorStop(1, 'rgba(0,0,0,0.92)');
        ctx.fillStyle = botGrad;
        ctx.fillRect(0, targetH - 360, targetW, 360);

        // 6. Bottom Banner Bar in University Theme Colors
        const barX = 40;
        const barY = targetH - 190;
        const barW = targetW - 80;
        const barH = 120;
        ctx.save();
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, 24);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // School IG Tag Text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '900 36px system-ui, -apple-system, sans-serif';
        ctx.fillText(schoolIg, barX + 32, barY + 54);

        ctx.font = '500 22px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillText(`Official ${school.name} Campus Feature`, barX + 32, barY + 92);

        // Right side committed badge
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.roundRect(barX + barW - 200, barY + 34, 170, 52, 16);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✨ COMMITTED', barX + barW - 115, barY + 68);
        ctx.restore();

        // Export data url
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      } catch (err) {
        console.warn('Failed to bake templated canvas:', err);
        resolve(imageSrc);
      }
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
};
