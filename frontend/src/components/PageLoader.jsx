import { LoaderIcon } from "lucide-react";
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen bg-surface">
      <LoaderIcon className="size-10 animate-spin text-primary-action" />
    </div>
  );
}
export default PageLoader;
