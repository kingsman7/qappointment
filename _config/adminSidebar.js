const pages = config('pages') // Get Pages from config

//Appointment
export default [
  {
    title: 'qappointment.sidebar.adminGroup',
    icon: 'fas fa-clipboard-check',
    children: [
      pages.mainqappointment.appointmentIndex,
      pages.qappointment.categories // categories setup
    ]
  },
]
