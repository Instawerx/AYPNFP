"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { collection, query, where, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  FileText,
  Download,
  Upload,
  Search,
  Filter,
  Folder,
  File,
  X,
} from "lucide-react";

interface Document {
  id: string;
  name: string;
  category: string;
  size: number;
  uploadedAt: any;
  uploadedBy: string;
  url: string;
  type: string;
}

const CATEGORIES = [
  "Tax Forms",
  "Benefits",
  "Policies",
  "Training",
  "Performance Reviews",
  "Personal",
  "Other",
];

export default function DocumentsPage() {
  const { user, claims } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadDocuments();
  }, [user]);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchTerm, categoryFilter]);

  const loadDocuments = async () => {
    try {
      const orgId = claims.orgId;

      const docsSnap = await getDocs(
        query(
          collection(db, `orgs/${orgId}/employeeDocuments`),
          where("employeeId", "==", user.uid)
        )
      );

      const docsList = docsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Document[];

      setDocuments(docsList);
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = [...documents];

    if (searchTerm) {
      filtered = filtered.filter((doc) =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((doc) => doc.category === categoryFilter);
    }

    setFilteredDocs(filtered);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const docsByCategory = CATEGORIES.map((category) => ({
    category,
    count: documents.filter((d) => d.category === category).length,
  }));

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Documents</h1>
            <p className="text-muted-foreground">
              Access and manage your HR documents
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Upload className="h-5 w-5" />
            Upload Document
          </button>
        </div>

        {/* Categories Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          {docsByCategory.map((item) => (
            <button
              key={item.category}
              onClick={() =>
                setCategoryFilter(
                  categoryFilter === item.category ? "all" : item.category
                )
              }
              className={`p-4 rounded-lg border-2 transition-all ${
                categoryFilter === item.category
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-primary/50"
              }`}
            >
              <Folder
                className={`h-8 w-8 mx-auto mb-2 ${
                  categoryFilter === item.category
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              />
              <p className="text-sm font-medium text-center">{item.category}</p>
              <p className="text-xs text-muted-foreground text-center">
                {item.count} files
              </p>
            </button>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {filteredDocs.length} of {documents.length} documents
            </p>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-lg shadow">
          {filteredDocs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No documents found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || categoryFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Upload your first document to get started"}
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Upload Document
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {filteredDocs.map((doc) => (
                <DocumentRow key={doc.id} document={doc} />
              ))}
            </div>
          )}
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <UploadModal
            onClose={() => setShowUploadModal(false)}
            onSuccess={() => {
              setShowUploadModal(false);
              loadDocuments();
            }}
          />
        )}
      </div>
    </div>
  );
}

// Component: Document Row
function DocumentRow({ document }: { document: Document }) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="p-6 hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <File className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{document.name}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <span>{document.category}</span>
              <span>•</span>
              <span>{formatFileSize(document.size)}</span>
              <span>•</span>
              <span>
                {document.uploadedAt?.toDate
                  ? new Date(document.uploadedAt.toDate()).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-muted/50 transition-colors">
          <Download className="h-4 w-4" />
          Download
        </button>
      </div>
    </div>
  );
}

// Component: Upload Modal
function UploadModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user, claims } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    category: "Personal",
  });
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const orgId = claims.orgId;

      // In a real implementation, you would upload the file to Firebase Storage
      // For now, we'll just create a document record
      await addDoc(collection(db, `orgs/${orgId}/employeeDocuments`), {
        name: formData.name,
        category: formData.category,
        employeeId: user.uid,
        size: 0, // Would be actual file size
        uploadedAt: Timestamp.now(),
        uploadedBy: user.uid,
        url: "", // Would be storage URL
        type: "application/pdf",
      });

      onSuccess();
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Upload Document</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-primary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Document Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Tax Form W-4"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              File <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">PDF, DOC, DOCX up to 10MB</p>
              <input type="file" className="hidden" accept=".pdf,.doc,.docx" />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
