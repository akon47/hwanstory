<template>
  <div class="container admin-layout">
    <aside class="admin-nav">
      <div class="admin-brand">
        <app-icon name="shield" :size="18"/>
        <span>관리자</span>
      </div>
      <nav class="admin-menu" aria-label="관리자 메뉴">
        <router-link v-for="item in menu" :key="item.path" :to="item.path" class="admin-menu-item"
                     :class="{ 'router-link-exact-active': isActive(item) }">
          <app-icon :name="item.icon" :size="18"/>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
    </aside>
    <section class="admin-content">
      <router-view/>
    </section>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import AppIcon from '@/components/common/AppIcon.vue';

interface MenuItem {
  path: string;
  label: string;
  icon: string;
}

export default defineComponent({
  name: 'AdminLayout',
  components: { AppIcon },
  data() {
    return {
      menu: [
        { path: '/admin', label: '대시보드', icon: 'bar-chart' },
        { path: '/admin/members', label: '회원', icon: 'users' },
        { path: '/admin/posts', label: '글', icon: 'file-text' },
        { path: '/admin/comments', label: '댓글', icon: 'comment' },
        { path: '/admin/tokens', label: '액세스 토큰', icon: 'key' },
        { path: '/admin/live', label: '실시간 접속', icon: 'radio' },
        { path: '/admin/system', label: '시스템', icon: 'terminal' },
      ] as Array<MenuItem>,
    };
  },
  methods: {
    isActive(item: MenuItem): boolean {
      return this.$route.path === item.path;
    },
  },
});
</script>

<style scoped>
.admin-layout {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: var(--s-8);
  padding-block: var(--s-6) var(--s-16);
  align-items: start;
}

.admin-nav {
  position: sticky;
  top: calc(var(--header-height) + var(--s-6));
  display: grid;
  gap: var(--s-3);
}

.admin-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  font-weight: 800;
  color: var(--text);
}

.admin-menu {
  display: grid;
  gap: 2px;
}

.admin-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: var(--radius-sm);
  color: var(--text-2);
  font-weight: 600;
  font-size: var(--text-sm);
}

.admin-menu-item:hover {
  background: var(--hover-color);
  color: var(--text);
  text-decoration: none;
}

.admin-menu-item.router-link-exact-active {
  background: var(--accent-soft);
  color: var(--accent-text);
}

.admin-content {
  min-width: 0;
  display: grid;
  gap: var(--s-6);
  align-content: start;
}

@media (max-width: 860px) {
  .admin-layout {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--s-4);
  }

  .admin-nav {
    position: static;
  }

  .admin-brand {
    display: none;
  }

  .admin-menu {
    display: flex;
    gap: 4px;
    overflow-x: auto;
    scrollbar-width: none;
    padding-bottom: 2px;
  }

  .admin-menu::-webkit-scrollbar {
    display: none;
  }

  .admin-menu-item {
    flex-shrink: 0;
    border-radius: var(--radius-pill);
    background: var(--surface-2);
  }
}
</style>
