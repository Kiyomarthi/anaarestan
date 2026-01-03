export interface Options {
  key?: string;
  headers?: Record<string, string>;
  params?: Record<string, string>;
  isCache?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  status: number;
  message: string;
  data: T | null;
  cache: boolean;
}

type ID = number;
type ISODateString = string;
type ActiveFlag = 0 | 1;

export interface Page {
  id: ID;
  slug: string;
  title: string;
  seo_title: string;
  seo_description: string;
  seo_index: ActiveFlag;
  seo_canonical: string;
  seo_og_type: "website" | "article";
  seo_image: string;
  is_active: ActiveFlag;
  created_at: ISODateString;
  updated_at: ISODateString;
  type: "Landing" | "Page";
}

export interface MediaBlock {
  id: ID;
  page_id: ID;
  type: "slider" | "banner";
  position: number;
  group_index: number;
  item_order: number;
  title: string;
  image: string;
  link: string;
  is_active: ActiveFlag;
  created_at: ISODateString;
}

export interface FAQ {
  id: ID;
  page_id: ID;
  question: string;
  answer: string; // HTML
  sort_order: number;
  is_active: ActiveFlag;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface PageContent {
  id: ID;
  page_id: ID;
  type: "html" | "text";
  title: string;
  body: string; // HTML
  is_active: ActiveFlag;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface PageLink {
  id: ID;
  page_id: ID;
  title: string;
  target: string;
  is_active: ActiveFlag;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface Breadcrumb {
  id: ID;
  page_id: ID;
  title: string;
  target: string;
  position: number;
  is_active: ActiveFlag;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface PageResponse {
  page: Page;
  media_blocks: MediaBlock[];
  faqs: FAQ[];
  contents: PageContent[];
  links: PageLink[];
  breadcrumbs: Breadcrumb[];
}

export interface Category {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  image: string;
  status: 0 | 1;
  code: string;
  created_at: string; // ISO Date
  updated_at: string; // ISO Date
  children?: Category[];
}
