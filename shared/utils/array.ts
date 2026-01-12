import type { MediaBlock } from "../types/api";

export function sortByNumberField<T, K extends keyof T>(
  list: T[],
  field: K,
  order: "asc" | "desc" = "asc"
): T[] {
  return [...list]
    .sort((a, b) => {
      const av = Number(a[field]);
      const bv = Number(b[field]);
      return order === "asc" ? av - bv : bv - av;
    })
    .map((item) => item);
}

export function getBannerAndSlider(media: MediaBlock[]) {
  const sliders: MediaBlock[] = [];
  const banners: MediaBlock[] = [];
  const groupedSliders: MediaBlock[][] = [];
  let sortedGroupedSliders: MediaBlock[][] = [];
  let sortedBanners: MediaBlock[] = [];

  media.forEach((m) => {
    if (m.type === "slider") sliders.push(m);
    banners.push(m);
  });

  let grouped = [];
  sliders.forEach((s, i) => {
    grouped = sliders.filter((s2) => {
      return s2.group_index == i + 1;
    });

    if (grouped.length) {
      groupedSliders.push(grouped);
    }

    grouped = [];
  });

  groupedSliders.forEach((sliders) => {
    sortedGroupedSliders = [
      ...sortedGroupedSliders,
      sortByNumberField(sliders, "position"),
    ];
  });

  sortedBanners = sortByNumberField(banners, "position");

  return { banners: sortedBanners, sliders: sortedGroupedSliders };
}

export function toDeep2Length(arr: any[]) {
  if (!arr?.length) return;
  const deep: unknown[] = [];

  for (let i = 0; i < arr.length; i += 2) {
    let child = [arr[i], i + 1 != arr.length && arr[i + 1]];
    deep.push(child);
  }

  return deep;
}

export function toDeep3Length(arr: any[]) {
  if (!arr?.length) return;
  const deep: unknown[] = [];

  for (let i = 0; i < arr.length; i += 3) {
    let child = [
      arr[i],
      i + 1 != arr.length && arr[i + 1],
      i + 2 != arr.length && arr[i + 2],
    ];
    deep.push(child);
  }

  return deep;
}
