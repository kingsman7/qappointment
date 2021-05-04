export default {
  appointments: {
    permission: 'iappointment.appointments.manage',
    activated: true,
    authenticated: true,
    path: '/appointment/appointments/index',
    name: 'qappointment.admin.appointments',
    crud: import('@imagina/qappointment/_crud/appointments'),
    page: () => import('@imagina/qcrud/_pages/admin/crudPage'),
    layout: () => import('@imagina/qsite/_layouts/master.vue'),
    title: 'qappointment.sidebar.adminAppointment',
    icon: 'fas fa-list-alt',
    subHeader: {
      refresh: true,
    }
  },
  categories: {
    permission: 'iappointment.appointments.manage',
    activated: true,
    authenticated: true,
    path: '/appointment/categories/index',
    name: 'qappointment.admin.categories',
    crud: import('@imagina/qappointment/_crud/categories'),
    page: () => import('@imagina/qcrud/_pages/admin/crudPage'),
    layout: () => import('@imagina/qsite/_layouts/master.vue'),
    title: 'qappointment.sidebar.adminCategories',
    icon: 'fas fa-layer-group',
    subHeader: {
      refresh: true,
      breadcrumb:['qappointment.appointments']
    }
  }
}
