export default {
  appointmentIndex: {
    permission: 'iappointment.appointments.customer-show',
    activated: true,
    authenticated: true,
    path: '/appointments/index',
    name: 'qappointment.main.appointments.index',
    crud: import('@imagina/qappointment/_crud/appointments'),
    page: () => import('@imagina/qcrud/_pages/admin/crudPage'),
    layout: () => import('@imagina/qsite/_layouts/master.vue'),
    title: 'qappointment.sidebar.panelAppointments',
    icon: 'fas fa-clipboard-check',
    subHeader: {
      refresh: true,
    }
  },
}
