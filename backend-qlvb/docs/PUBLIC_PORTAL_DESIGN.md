# Public Document Portal – Design (Backend)

Goal: Enable a public portal where anyone can upload and download documents. Each document can belong to multiple categories, and categories are hierarchical (categories with nested subcategories). Design aligns with current models/services in this codebase.

## Requirements
- Public upload (no login) with basic metadata and attachments
- Public download (no login)
- Document ↔ Category: many-to-many
- Category hierarchy (tree) with arbitrary depth
- Moderate/approve before publishing (optional but recommended)
- Keep using existing storage/FileStorageService and DocumentAttachment where possible

## Data Model Changes

1) DocumentCategory (new)
- id: Long (PK)
- name: String (required)
- slug: String (unique)
- description: String (optional)
- parent: DocumentCategory (self-reference, nullable)
- isActive: Boolean (default true)
- createdAt, updatedAt: timestamps

2) Document ←→ DocumentCategory (new join)
- ManyToMany from `Document` to `DocumentCategory`
- Join table: `document_category_links` with columns (document_id, category_id)
- Add helper methods on `Document` for set/add/remove categories

3) Document (augment existing `node` table)
- isPublic: Boolean (default false) – indicates this doc is publicly visible
- publishedAt: LocalDateTime (nullable) – set when approved/published
- uploaderName, uploaderEmail (optional, for anonymous submissions)

Notes:
- Keep using `DocumentAttachment` for files. Public downloads stream via controller using the stored path.
- Keep `type` column; for public submissions, set `type = "PUBLIC"` to distinguish.

## Repositories
- DocumentCategoryRepository: CRUD, findBySlug, findByParentIsNull, findByParent, existsBySlug
- Extend `DocumentRepository` with queries for public browsing:
  - Page<Document> findByIsPublicTrue(Pageable)
  - Page<Document> findByIsPublicTrueAndTitleContaining(String, Pageable)
  - @Query to fetch by category id(s) with paging

## Services
- DocumentCategoryService
  - CRUD; return tree structures
  - getTree(): returns all categories with children, minimal fields

- PublicDocumentService
  - createPublicDocument(dto, files):
    - Create `Document` with type PUBLIC, status = DRAFT or NOT_PROCESSED, isPublic = false by default
    - Save attachments via FileStorageService → create `DocumentAttachment` records
    - Link categories
    - Optionally notify admins for moderation
  - publishDocument(id): set isPublic = true, publishedAt = now
  - listPublicDocuments(filter): paging + search
  - listByCategory(categoryId, recursive=true)

Reuse:
- FileStorageService: continue storing to `data/uploads` or `document-uploads`; expose via download endpoints.
- DocumentAttachmentService: retain semantics; ensure attachments are retrieved by document id publicly.

## Controllers (new endpoints)

Base: `/api/public`

- GET `/categories/tree`
  - Returns full category tree for browsing

- GET `/categories/{id}/documents`
  - Query params: `page`, `size`, `q` (search by title), `recursive=true|false`

- GET `/documents`
  - Public list of documents: `page`, `size`, `q`

- GET `/documents/{id}`
  - Public document details (metadata + attachments)

- GET `/documents/{id}/attachments/{attachmentId}/download`
  - Streams file via Resource

- POST `/documents/upload` (multipart/form-data)
  - Fields: `title` (required), `summary` (optional), `categories` (CSV of ids), `uploaderName` (optional), `uploaderEmail` (optional)
  - Files: one or many `files`
  - Response: created doc info (not public until moderated)
  - Consider adding CAPTCHA + rate limit

Admin/Moderator (optional) under `/api/admin/public-docs`:
- POST `/{id}/publish` – publish
- POST `/{id}/reject` – reject/delete

## DTOs (sketch)

- CategoryDTO { id, name, slug, parentId, children?: CategoryDTO[] }
- PublicDocumentCreateRequest { title, summary?, categoryIds: number[], uploaderName?, uploaderEmail? }
- PublicDocumentResponse { id, title, summary?, categories: CategoryDTO[], attachments: AttachmentDTO[] }
- AttachmentDTO { id, originalFilename, fileSize }

## Security and Ops
- Public endpoints should be rate-limited (IP-based). Optionally add CAPTCHA for upload.
- Virus/malware scanning recommended for uploads (pre- or post-store hook).
- Validate file types and sizes; enforce per-file and per-request total size.
- If staying behind controller for downloads, ensure proper `Content-Disposition` and content type.

## Migration Outline (JPA/SQL)
- Create `document_categories` (id, name, slug unique, description, parent_id FK, is_active, created_at, updated_at)
- Create `document_category_links` (document_id FK to `node`, category_id FK)
- Alter `node` add columns: is_public boolean default false, published_at timestamp, uploader_name, uploader_email
- Add indexes on `document_category_links(category_id)`, `document_categories(parent_id)`, `node(is_public, published_at)`

## Integration Points with Existing Code
- Use `DocumentAttachment` for uploads; nothing to duplicate
- Use `FileStorageService` for saving files and returning Resource for download
- Keep `DocumentType` intact; public docs can optionally map to a specific `DocumentType` if needed
- Keep `DocumentProcessingStatus` minimal for public flow: e.g., DRAFT → PUBLISHED

## Minimal Success Criteria
- Can create categories and nested categories
- Can upload a document anonymously to one or more categories
- After moderation/publish, can list and download without login
- Backend supports paging and search by title

## Next Steps
- Add entities + repositories + services + controllers as described
- Wire upload endpoint to `FileStorageService`
- Add basic unit/integration tests for tree retrieval and upload/download flow
- Expose OpenAPI for new public endpoints
