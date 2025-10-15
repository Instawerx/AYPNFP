/**
 * airSlate API Client
 * 
 * This module provides a client for interacting with the airSlate API
 * for document generation, template management, and workflow automation.
 * 
 * Documentation: https://docs.airslate.com/
 */

// Types
export interface AirSlateConfig {
  apiKey: string;
  orgId: string;
  baseUrl?: string;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  fields: TemplateField[];
  createdAt: string;
  updatedAt: string;
}

export interface TemplateField {
  name: string;
  type: 'text' | 'number' | 'date' | 'signature' | 'checkbox' | 'dropdown';
  required: boolean;
  defaultValue?: any;
  options?: string[]; // For dropdown fields
}

export interface Document {
  id: string;
  templateId: string;
  status: 'draft' | 'pending' | 'completed' | 'cancelled';
  fields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  downloadUrl?: string;
}

export interface CreateDocumentRequest {
  templateId: string;
  fields: Record<string, any>;
  metadata?: Record<string, any>;
}

// API Client Class
export class AirSlateClient {
  private apiKey: string;
  private orgId: string;
  private baseUrl: string;

  constructor(config: AirSlateConfig) {
    this.apiKey = config.apiKey;
    this.orgId = config.orgId;
    this.baseUrl = config.baseUrl || 'https://api.airslate.com/v1';
  }

  /**
   * Make an authenticated request to the airSlate API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'X-Organization-Id': this.orgId,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message || `airSlate API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Get all templates
   */
  async getTemplates(): Promise<Template[]> {
    try {
      const response = await this.request<{ data: Template[] }>('/templates');
      return response.data;
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  }

  /**
   * Get a specific template by ID
   */
  async getTemplate(templateId: string): Promise<Template> {
    try {
      const response = await this.request<{ data: Template }>(
        `/templates/${templateId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching template:', error);
      throw error;
    }
  }

  /**
   * Create a document from a template
   */
  async createDocument(request: CreateDocumentRequest): Promise<Document> {
    try {
      const response = await this.request<{ data: Document }>('/documents', {
        method: 'POST',
        body: JSON.stringify(request),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    }
  }

  /**
   * Update a document
   */
  async updateDocument(
    documentId: string,
    fields: Record<string, any>
  ): Promise<Document> {
    try {
      const response = await this.request<{ data: Document }>(
        `/documents/${documentId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ fields }),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }

  /**
   * Submit a document for processing
   */
  async submitDocument(documentId: string): Promise<Document> {
    try {
      const response = await this.request<{ data: Document }>(
        `/documents/${documentId}/submit`,
        {
          method: 'POST',
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error submitting document:', error);
      throw error;
    }
  }

  /**
   * Get document status
   */
  async getDocumentStatus(documentId: string): Promise<Document> {
    try {
      const response = await this.request<{ data: Document }>(
        `/documents/${documentId}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching document status:', error);
      throw error;
    }
  }

  /**
   * Download a completed document
   */
  async downloadDocument(documentId: string): Promise<Blob> {
    try {
      const url = `${this.baseUrl}/documents/${documentId}/download`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Organization-Id': this.orgId,
        },
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      return response.blob();
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  }

  /**
   * Cancel a document
   */
  async cancelDocument(documentId: string): Promise<Document> {
    try {
      const response = await this.request<{ data: Document }>(
        `/documents/${documentId}/cancel`,
        {
          method: 'POST',
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error cancelling document:', error);
      throw error;
    }
  }
}

/**
 * Create an airSlate client instance
 */
export function createAirSlateClient(): AirSlateClient {
  const apiKey = process.env.AIRSLATE_API_KEY;
  const orgId = process.env.AIRSLATE_ORG_ID;

  if (!apiKey || !orgId) {
    throw new Error(
      'airSlate credentials not configured. Set AIRSLATE_API_KEY and AIRSLATE_ORG_ID environment variables.'
    );
  }

  return new AirSlateClient({
    apiKey,
    orgId,
    baseUrl: process.env.AIRSLATE_BASE_URL,
  });
}

/**
 * Mock airSlate client for development/testing
 * This simulates the airSlate API without making real requests
 */
export class MockAirSlateClient extends AirSlateClient {
  private mockTemplates: Template[] = [
    {
      id: 'template-1',
      name: 'Donation Receipt',
      description: 'Official donation receipt for tax purposes',
      fields: [
        { name: 'donorName', type: 'text', required: true },
        { name: 'donorEmail', type: 'text', required: true },
        { name: 'donationAmount', type: 'number', required: true },
        { name: 'donationDate', type: 'date', required: true },
        { name: 'taxDeductible', type: 'checkbox', required: false },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'template-2',
      name: 'Volunteer Agreement',
      description: 'Volunteer service agreement form',
      fields: [
        { name: 'volunteerName', type: 'text', required: true },
        { name: 'volunteerEmail', type: 'text', required: true },
        { name: 'startDate', type: 'date', required: true },
        { name: 'role', type: 'dropdown', required: true, options: ['Event Support', 'Mentorship', 'Administrative'] },
        { name: 'signature', type: 'signature', required: true },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'template-3',
      name: 'Grant Application',
      description: 'Grant funding application form',
      fields: [
        { name: 'organizationName', type: 'text', required: true },
        { name: 'contactPerson', type: 'text', required: true },
        { name: 'requestedAmount', type: 'number', required: true },
        { name: 'projectDescription', type: 'text', required: true },
        { name: 'applicationDate', type: 'date', required: true },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  private mockDocuments: Map<string, Document> = new Map();

  async getTemplates(): Promise<Template[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.mockTemplates;
  }

  async getTemplate(templateId: string): Promise<Template> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const template = this.mockTemplates.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    return template;
  }

  async createDocument(request: CreateDocumentRequest): Promise<Document> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const document: Document = {
      id: `doc-${Date.now()}`,
      templateId: request.templateId,
      status: 'draft',
      fields: request.fields,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.mockDocuments.set(document.id, document);
    return document;
  }

  async updateDocument(documentId: string, fields: Record<string, any>): Promise<Document> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const document = this.mockDocuments.get(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    document.fields = { ...document.fields, ...fields };
    document.updatedAt = new Date().toISOString();
    
    return document;
  }

  async submitDocument(documentId: string): Promise<Document> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const document = this.mockDocuments.get(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    document.status = 'completed';
    document.updatedAt = new Date().toISOString();
    document.downloadUrl = `https://mock-storage.example.com/documents/${documentId}.pdf`;
    
    return document;
  }

  async getDocumentStatus(documentId: string): Promise<Document> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const document = this.mockDocuments.get(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }
    
    return document;
  }

  async downloadDocument(documentId: string): Promise<Blob> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return a mock PDF blob
    const mockPdf = new Blob(['Mock PDF content'], { type: 'application/pdf' });
    return mockPdf;
  }

  async cancelDocument(documentId: string): Promise<Document> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const document = this.mockDocuments.get(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    document.status = 'cancelled';
    document.updatedAt = new Date().toISOString();
    
    return document;
  }
}

/**
 * Get airSlate client (mock in development, real in production)
 */
export function getAirSlateClient(): AirSlateClient {
  // Use mock client in development
  if (process.env.NODE_ENV === 'development' || !process.env.AIRSLATE_API_KEY) {
    console.log('Using mock airSlate client (development mode)');
    return new MockAirSlateClient({ apiKey: 'mock', orgId: 'mock' });
  }

  return createAirSlateClient();
}
