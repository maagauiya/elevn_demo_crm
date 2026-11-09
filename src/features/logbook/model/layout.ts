/**
 * Раскладка пересекающихся записей внутри колонки: каждая получает дорожку (lane) и число дорожек
 * в своей группе пересечений. Ширина карточки = 1 / lanes, сдвиг = lane / lanes.
 */
export interface Interval {
  id: number;
  start: number;
  end: number;
}

export interface Placed<T> {
  item: T;
  lane: number;
  lanes: number;
  /** Группа взаимно пересекающихся записей и её границы */
  group: number;
  groupStart: number;
  groupEnd: number;
}

export function layoutColumn<T extends Interval>(items: T[]): Placed<T>[] {
  const sorted = [...items].sort((a, b) => a.start - b.start || b.end - a.end);
  const result: Placed<T>[] = [];
  let group: Placed<T>[] = [];
  let laneEnds: number[] = [];
  let groupEnd = -Infinity;
  let groupIndex = 0;

  const flush = () => {
    const start = Math.min(...group.map((p) => p.item.start));
    for (const placed of group) {
      placed.lanes = laneEnds.length;
      placed.groupStart = start;
      placed.groupEnd = groupEnd;
    }
    groupIndex += 1;
    result.push(...group);
    group = [];
    laneEnds = [];
  };

  for (const item of sorted) {
    if (item.start >= groupEnd) {
      if (group.length) flush();
      groupEnd = -Infinity;
    }
    let lane = laneEnds.findIndex((end) => end <= item.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(item.end);
    } else {
      laneEnds[lane] = item.end;
    }
    group.push({ item, lane, lanes: 0, group: groupIndex, groupStart: item.start, groupEnd: item.end });
    groupEnd = Math.max(groupEnd, item.end);
  }
  if (group.length) flush();
  return result;
}

/**
 * Если дорожек больше, чем помещается в колонку, видимыми остаются первые (max - 1),
 * остальные записи группы уходят в «+N» на последней дорожке.
 */
export function capLanes<T extends Interval>(placed: Placed<T>[], maxLanes: number) {
  const visible: (Placed<T> & { shownLanes: number })[] = [];
  const overflow = new Map<number, { start: number; end: number; items: T[] }>();
  for (const p of placed) {
    if (p.lanes <= maxLanes) {
      visible.push({ ...p, shownLanes: p.lanes });
    } else if (p.lane < maxLanes - 1) {
      visible.push({ ...p, shownLanes: maxLanes });
    } else {
      const bucket = overflow.get(p.group) ?? { start: p.groupStart, end: p.groupEnd, items: [] };
      bucket.items.push(p.item);
      overflow.set(p.group, bucket);
    }
  }
  return { visible, overflow: [...overflow.values()] };
}
