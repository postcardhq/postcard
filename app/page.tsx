import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EvidenceUpload } from "@/components/ui/UploadFileBox";

export default function PostcardHome() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-bold"></h1>
      <EvidenceUpload />
    </div>
  );
}