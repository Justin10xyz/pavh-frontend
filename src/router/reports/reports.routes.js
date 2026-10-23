export default [
    {
        path: '/reportes',
        name: 'reports.comprobantes',
        component: () => import('@/views/reports/ReportsView.vue'),
        meta: { layout: 'AppLayout', section: 'reports', title: 'Reportes', requiresAuth: true },
    },
]
