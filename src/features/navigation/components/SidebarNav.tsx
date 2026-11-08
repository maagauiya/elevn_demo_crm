import { ChevronRight, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, useLocation } from 'react-router';
import { cn } from '@/shared/lib/cn';
import { ErrorState, Input, Skeleton } from '@/shared/ui';
import { type NavFolder, type NavItem, type NavNode, useNavMenu } from '../api/nav-api';
import { NS } from '../i18n';
import { NavIcon } from './nav-icon';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2.5 rounded-sm px-3 py-1.5 text-body text-ink-muted transition-colors hover:bg-canvas-sunken hover:text-ink',
    isActive && 'bg-accent-tint font-medium text-accent hover:bg-accent-tint hover:text-accent',
  );

function containsPath(node: NavNode, pathname: string): boolean {
  return node.kind === 'item' ? node.path === pathname : node.children.some((c) => containsPath(c, pathname));
}

function ItemLink({ item, onNavigate, hint }: { item: NavItem; onNavigate?: () => void; hint?: string }) {
  return (
    <NavLink to={item.path} end onClick={onNavigate} className={linkClass} title={item.name}>
      <NavIcon name={item.icon} />
      <span className="flex min-w-0 flex-col">
        <span className="truncate">{item.name}</span>
        {hint ? <span className="truncate text-micro text-ink-faint">{hint}</span> : null}
      </span>
    </NavLink>
  );
}

function FolderNode({ folder, depth, onNavigate }: { folder: NavFolder; depth: number; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  // Папка с активным разделом раскрыта сразу.
  const [open, setOpen] = useState(() => containsPath(folder, pathname));
  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
        }}
        className={cn(
          'flex w-full cursor-pointer items-center gap-2.5 rounded-sm px-3 py-1.5 text-left text-body text-ink transition-colors hover:bg-canvas-sunken',
          depth === 0 && 'font-medium',
        )}
      >
        <NavIcon name={folder.icon} />
        <span className="flex-1 truncate">{folder.name}</span>
        <ChevronRight className={cn('size-3.5 shrink-0 text-ink-faint transition-transform', open && 'rotate-90')} />
      </button>
      {open ? (
        <ul className="ml-4 flex flex-col gap-0.5 border-l border-hairline pl-1">
          <NavNodes nodes={folder.children} depth={depth + 1} {...(onNavigate ? { onNavigate } : {})} />
        </ul>
      ) : null}
    </li>
  );
}

function NavNodes({ nodes, depth, onNavigate }: { nodes: NavNode[]; depth: number; onNavigate?: () => void }) {
  return nodes.map((node) =>
    node.kind === 'folder' ? (
      <FolderNode key={node.key} folder={node} depth={depth} {...(onNavigate ? { onNavigate } : {})} />
    ) : (
      <li key={node.key}>
        <ItemLink item={node} {...(onNavigate ? { onNavigate } : {})} />
      </li>
    ),
  );
}

/** Путь папок до пункта — подсказка в результатах поиска. */
function breadcrumbs(tree: NavNode[]): Map<number, string> {
  const result = new Map<number, string>();
  const walk = (nodes: NavNode[], trail: string[]) => {
    for (const node of nodes) {
      if (node.kind === 'folder') walk(node.children, [...trail, node.name]);
      else result.set(node.key, trail.join(' › '));
    }
  };
  walk(tree, []);
  return result;
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation(NS);
  const menu = useNavMenu();
  const [query, setQuery] = useState('');
  const crumbs = useMemo(() => (menu.data ? breadcrumbs(menu.data.tree) : new Map<number, string>()), [menu.data]);

  if (menu.isPending) {
    return (
      <div className="flex flex-col gap-2 px-3 py-2">
        {Array.from({ length: 9 }, (_, i) => (
          <Skeleton key={i} className="h-7" />
        ))}
      </div>
    );
  }
  if (menu.isError) return <ErrorState onRetry={() => void menu.refetch()} className="py-6" />;

  const q = query.trim().toLowerCase();
  const found = q ? menu.data.items.filter((item) => item.name.toLowerCase().includes(q)) : null;
  const navigateProps = onNavigate ? { onNavigate } : {};

  return (
    <nav aria-label={t('menu')} className="flex flex-col gap-2 px-3 py-2">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-faint" />
        <Input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          placeholder={t('search')}
          aria-label={t('search')}
          className="h-8 pl-8"
        />
      </div>
      {found ? (
        found.length ? (
          <ul className="flex flex-col gap-0.5">
            {found.map((item) => (
              <li key={item.key}>
                <ItemLink item={item} hint={crumbs.get(item.key) ?? ''} {...navigateProps} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-3 py-2 text-body text-ink-muted">{t('nothingFound')}</p>
        )
      ) : (
        <ul className="flex flex-col gap-0.5">
          <NavNodes nodes={menu.data.tree} depth={0} {...navigateProps} />
        </ul>
      )}
    </nav>
  );
}
