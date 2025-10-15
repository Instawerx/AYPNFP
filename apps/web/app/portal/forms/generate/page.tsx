"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { FileText, Send, Eye, AlertCircle, CheckCircle } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: TemplateField[];
}

interface TemplateField {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
  options?: string[];
}

export default function GenerateFormPage() {
  const { claims, user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submissionId, setSubmissionId] = useState("");

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const orgId = claims.orgId;
      const response = await fetch(`/api/forms/templates?orgId=${orgId}`);
      
      if (!response.ok) {
        throw new Error("Failed to load templates");
      }

      const data = await response.json();
      setTemplates(data.templates);
    } catch (error) {
      console.error("Error loading templates:", error);
      setError("Failed to load form templates");
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setFormData({});
    setError("");
    setSuccess(false);
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (!selectedTemplate) {
      setError("Please select a template");
      setSubmitting(false);
      return;
    }

    // Validate required fields
    const requiredFields = selectedTemplate.fields.filter((f) => f.required);
    for (const field of requiredFields) {
      if (!formData[field.name]) {
        setError(`Please fill in required field: ${field.name}`);
        setSubmitting(false);
        return;
      }
    }

    try {
      const response = await fetch("/api/forms/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          fields: formData,
          metadata: {
            submittedBy: user?.uid,
            email: user?.email,
            displayName: user?.displayName || user?.email,
          },
          orgId: claims.orgId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate form");
      }

      const data = await response.json();
      setSuccess(true);
      setSubmissionId(data.submissionId);
      setFormData({});
    } catch (err: any) {
      setError(err.message || "Failed to generate form");
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: TemplateField) => {
    const value = formData[field.name] || field.defaultValue || "";

    switch (field.type) {
      case "text":
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required={field.required}
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(field.name, parseFloat(e.target.value))}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required={field.required}
          />
        );

      case "date":
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required={field.required}
          />
        );

      case "checkbox":
        return (
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => handleFieldChange(field.name, e.target.checked)}
            className="w-5 h-5"
          />
        );

      case "dropdown":
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required={field.required}
          >
            <option value="">Select an option</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case "signature":
        return (
          <div className="border-2 border-dashed rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Signature field (implementation pending)
            </p>
            <input
              type="text"
              placeholder="Type your name to sign"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className="mt-2 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required={field.required}
            />
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required={field.required}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Generate Form</h1>
              <p className="text-muted-foreground">
                Select a template and fill in the details
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">Form Submitted!</h3>
                <p className="text-sm text-green-800">
                  Your form has been generated and submitted for review.
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Submission ID: {submissionId}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-destructive">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4">Select Template</h3>
              
              {templates.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No templates available
                </p>
              ) : (
                <div className="space-y-2">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`w-full text-left p-3 border rounded-lg hover:bg-muted/50 transition-colors ${
                        selectedTemplate?.id === template.id
                          ? "border-primary bg-primary/5"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <FileText className="h-5 w-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">{template.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {template.description}
                          </p>
                          <span className="inline-block mt-2 px-2 py-0.5 bg-muted text-xs rounded">
                            {template.category}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2">
            {!selectedTemplate ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Template Selected</h3>
                <p className="text-muted-foreground">
                  Select a template from the list to get started
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-6">{selectedTemplate.name}</h3>

                <div className="space-y-4">
                  {selectedTemplate.fields.map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium mb-2">
                        {field.name.replace(/([A-Z])/g, " $1").trim()}
                        {field.required && (
                          <span className="text-destructive ml-1">*</span>
                        )}
                      </label>
                      {renderField(field)}
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-6 pt-6 border-t">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-5 w-5" />
                    {submitting ? "Generating..." : "Generate & Submit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTemplate(null)}
                    className="px-6 py-3 border rounded-lg hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
