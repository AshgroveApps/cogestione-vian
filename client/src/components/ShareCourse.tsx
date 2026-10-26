import { useState } from "react";
import {
  FacebookShareButton,
  WhatsappShareButton,
  EmailShareButton,
  FacebookIcon,
  WhatsappIcon,
  EmailIcon,
} from "react-share";
import { Share2, Copy, Check, X } from "lucide-react";

interface ShareCourseProps {
  title: string;
  url: string;
  description?: string;
}

export default function ShareCourse({ title, url, description }: ShareCourseProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnX = () => {
    const text = encodeURIComponent(`${title} - ${description || ""}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, "_blank");
  };

  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Share2 className="h-5 w-5 text-gold-600" />
        <h3 className="font-display text-lg font-semibold">Condividi questo corso</h3>
      </div>

      <div className="mb-4 flex gap-3">
        <FacebookShareButton url={url} hashtag="#CogestioneVian" className="rounded-full overflow-hidden hover:opacity-80 transition">
          <FacebookIcon size={40} />
        </FacebookShareButton>
        <button
          onClick={shareOnX}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white hover:opacity-80 transition"
          aria-label="Condividi su X"
        >
          <X className="h-5 w-5" />
        </button>
        <WhatsappShareButton url={url} separator=":: " className="rounded-full overflow-hidden hover:opacity-80 transition">
          <WhatsappIcon size={40} />
        </WhatsappShareButton>
        <EmailShareButton url={url} subject={title} body={description} className="rounded-full overflow-hidden hover:opacity-80 transition">
          <EmailIcon size={40} />
        </EmailShareButton>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={url}
          readOnly
          className="input flex-1 text-sm"
        />
        <button
          onClick={handleCopy}
          className="btn btn-primary flex items-center gap-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copiato
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copia
            </>
          )}
        </button>
      </div>
    </div>
  );
}
