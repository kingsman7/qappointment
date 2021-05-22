<template></template>
<script>
export default {
  data() {
    return {
      crudId: this.$uid()
    }
  },
  computed: {
    crudData() {
      return {
        crudId: this.crudId,
        entityName: config("main.qappointment.entityNames.appointments"),
        permission: 'iappointment.appointments',
        apiRoute: 'apiRoutes.qappointment.appointments',
        extraFormFields: 'iappointment.crud-fields.appointments',
        create: {
          title: this.$tr('qappointment.layout.newAppointment'),
        },
        read: {
          columns: [
            {name: 'id', label: this.$tr('ui.form.id'), field: 'id', style: 'width: 50px'},
            {
              name: 'customer', label: this.$tr('qappointment.layout.form.customer'), align: 'left',
              field: 'customer', sortable: true, format: val => ((val && val.fullName) ? val.fullName : '-')
            },
            {
              name: 'assigned', label: this.$tr('qappointment.layout.form.assigned'), align: 'left',
              field: 'assigned', sortable: true, format: val => ((val && val.fullName) ? val.fullName : '-')
            },
            {
              name: 'category', label: this.$tr('ui.form.category'),
              align: 'left', field: 'category', sortable: true,
              format: val => ((val && val.title) ? val.title : '-')
            },
            {
              name: 'statusinfo', label: this.$tr('ui.form.status'), field: 'status', align: 'left',
              format: val => ((val && val.title) ? val.title : '-')
            },
            {
              name: 'description', label: this.$tr('ui.form.description'), field: 'description',
              align: 'left', classes: 'ellipsis', style: 'max-width : 250px'
            },
            {
              name: 'created_at', label: this.$tr('ui.form.createdAt'), field: 'createdAt', align: 'left',
              format: val => val ? this.$trd(val) : '-',
            },
            {
              name: 'updatedAt', label: this.$tr('ui.form.updatedAt'), field: 'updatedAt', align: 'left',
              format: val => val ? this.$trd(val) : '-',
            },
            {name: 'actions', label: this.$tr('ui.form.actions'), align: 'left'},
          ],
          requestParams: {include: 'category,customer,assigned,status'},
          filters: {
            categories: {
              value: null,
              type: 'treeSelect',
              props: {
                label: this.$tr('ui.label.category')
              },
              loadOptions: {
                apiRoute: 'apiRoutes.qappointment.categories'
              }
            }
          }
        },
        update: {
          title: this.$tr('qappointment.layout.updateAppointment')
        },
        delete: true,
        formLeft: {
          id: {value: ''},
          userId: {value: this.$store.state.quserAuth.userId},
          customerId: {
            type: 'crud',
            props: {
              crudType: 'select',
              crudData: import('@imagina/quser/_crud/users'),
              crudProps: {
                label: this.$trp('qappointment.layout.form.customer') + "*",
                rules: [
                  val => !!val || this.$tr('ui.message.fieldRequired')
                ],
              },
              config: {
                options: {
                  label: 'fullName', value: 'id'
                }
              },
            },
          },
          assignedTo: {
            type: 'crud',
            props: {
              crudType: 'select',
              crudData: import('@imagina/quser/_crud/users'),
              crudProps: {
                label: this.$trp('qappointment.layout.form.assigned'),
              },
              config: {
                options: {
                  label: 'fullName', value: 'id'
                }
              },
            },
          },
          categoryId: {
            type: 'crud',
            props: {
              crudType: 'select',
              crudData: import('@imagina/qappointment/_crud/categories'),
              crudProps: {
                label: `${this.$tr('ui.form.category')}*`,
                rules: [
                  val => !!val || this.$tr('ui.message.fieldRequired')
                ],
              },
              config: {
                options: {
                  label: 'title', value: 'id'
                }
              },
            },
          },
          statusId: {
            value: '1',
            type: 'select',
            props: {
              label: `${this.$tr('ui.form.status')}:`,
              rules: [
                val => !!val || this.$tr('ui.message.fieldRequired')
              ],
            },
            loadOptions: {
              apiRoute: 'apiRoutes.qappointment.appointmentStatuses',
            }
          },
          description: {
            value: '',
            type: 'html',
            isTranslatable: true,
            props: {
              label: `${this.$tr('ui.form.description')}*`,
              rules: [
                val => !!val || this.$tr('ui.message.fieldRequired')
              ],
            }
          },
        },
      }
    },
    //Crud info
    crudInfo() {
      return this.$store.state.qcrudComponent.component[this.crudId] || {}
    }
  },
}
</script>
