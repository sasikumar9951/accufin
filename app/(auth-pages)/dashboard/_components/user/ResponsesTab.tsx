import FileBrowser from "@/app/_component/FileBrowser";
import { ManagedFile } from "@/types/files";
import { useState, useEffect, useMemo } from "react";
import { Loader } from "@/components/ui/loader";

type Folder = {
  id: string;
  name: string;
};

export default function ResponsesTab() {
  // Raw payload from API (folders and files mixed)
  const [allItems, setAllItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumbPath, setBreadcrumbPath] = useState<
    { id: string; name: string }[]
  >([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch response files data
  useEffect(() => {
    const fetchResponseFiles = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/user/listResponseFile");
        if (!res.ok) throw new Error("Failed to fetch response files");
        const data = await res.json();
        setAllItems(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching response files:", error);
        setAllItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResponseFiles();
  }, []);

  // Build breadcrumb path
  const buildBreadcrumbPath = (
    targetFolderId: string | null,
    source: any[]
  ): { id: string; name: string }[] => {
    if (!targetFolderId) return [];
    const path: { id: string; name: string }[] = [];
    let currentId: string | null = targetFolderId;
    while (currentId) {
      const folder = source.find(
        (f) => f.id === currentId && f.type === "folder"
      );
      if (!folder) break;
      path.unshift({
        id: folder.id,
        name: folder.name || folder.folderName || "Unnamed Folder",
      });
      currentId = folder.parentFolderId || null;
    }
    return path;
  };

  const handleFolderChange = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setBreadcrumbPath(buildBreadcrumbPath(folderId, allItems));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/user/listResponseFile");
      if (!res.ok) throw new Error("Failed to fetch response files");
      const data = await res.json();
      setAllItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error refreshing response files:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Derive files and folders for the current directory
  const { displayedFiles, displayedFolders } = useMemo(() => {
    const files: any[] = [];
    const folders: Folder[] = [];

    for (const item of allItems) {
      if (item?.parentFolderId === currentFolderId) {
        if (item?.type === "folder") {
          folders.push({
            id: item.id,
            name: item.name || item.folderName || "Unnamed Folder",
          });
        } else {
          files.push(item);
        }
      }
    }

    return { displayedFiles: files, displayedFolders: folders };
  }, [allItems, currentFolderId]);

  // Map to ManagedFile for FileBrowser
  const managedResponseFiles: ManagedFile[] = useMemo(
    () =>
      (displayedFiles || []).map((file: any) => ({
        id: file.id,
        name: file.name || "Unnamed File",
        url: file.url,
        size: file.size,
        createdAt: file.createdAt,
        folderName: file.folderName,
        parentFolderId: file.parentFolderId,
      })),
    [displayedFiles]
  );
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center rounded-md bg-cyan-600 p-2 text-white shadow hover:bg-cyan-700 disabled:opacity-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-3.51-7.07" />
            <polyline points="22 3 21 7 17 6" />
          </svg>
        </button>
      </div>
      {isLoading ? (
        <div className="w-full h-[50vh] flex items-center justify-center">
          <div className="flex flex-col items-center justify-center">
            <Loader size={48} className="text-emerald-600 mb-3" />
            <div className="text-sm text-gray-600">Loading responses...</div>
          </div>
        </div>
      ) : (
        <FileBrowser
          files={managedResponseFiles}
          folders={displayedFolders}
          isLoading={false}
          currentFolderId={currentFolderId}
          onFolderChange={handleFolderChange}
          breadcrumbPath={breadcrumbPath}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          // The following props are for read-only mode
          isUploading={false}
          handleFileSelect={() => {}}
          handleFileUpload={() => {}}
          selectedFiles={[]}
          onRemoveSelectedFile={() => {}}
          showUploadButton={false}
          showAddFolderButton={false}
          showUploadFolderButton={false}
          theme="admin-response"
        />
      )}
    </div>
  );
}
