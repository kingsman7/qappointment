const pages = config('pages') // Get Pages from config

//Appointment
export default [
  {
    title: 'qappointment.sidebar.adminGroup',
    icon: 'fas fa-calendar-check',
    children: [
      pages.qappointment.appointments, // appointments setup
      pages.qappointment.categories, // categories setup
    ]
  },
]
