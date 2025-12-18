export type SeoItem = {
  title: string;
  description: string;
  canonical?: string;
  robots?: string;
  keywords?: string[];
  image?: string;
  ogType?:
    | "website"
    | "article"
    | "book"
    | "profile"
    | "music.song"
    | "music.album"
    | "music.playlist"
    | "music.radio_status"
    | "video.movie"
    | "video.episode"
    | "video.tv_show"
    | "video.other"
    | undefined;
  twitterCard?: string;
  locale?: string;
  author?: string;
};
