<template></template>
<script>
//Component
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
        entityName: config("main.qappointment.entityNames.category"),
        apiRoute: 'apiRoutes.qappointment.categories',
        permission: 'iappointment.appointments',
        create: {
          title: this.$tr('qappointment.layout.newCategory'),
        },
        read: {
          columns: [
            {name: 'id', label: this.$tr('ui.form.id'), field: 'id', style: 'width: 50px'},
            {name: 'title', label: this.$tr('ui.form.title'), field: 'title', style: 'width: 50px', align: 'left'},
            {name: 'slug', label: this.$tr('ui.form.slug'), field: 'slug', align: 'left'},
            {
              name: 'parent', label: this.$tr('ui.form.parent'), field: 'parent', align: 'left',
              format: val => val ? (val.title ? val.title : '-') : '-'
            },
            {
              name: 'form', label: this.$tr('ui.label.form'), field: 'form', align: 'left',
              format: val => val ? (val.title ? val.title : '-') : '-'
            },
            {
              name: 'description', label: this.$tr('ui.form.description'), field: 'description',
              align: 'left', style: 'width: 100px'
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
          requestParams: {include: 'parent'}
        },
        update: {
          title: this.$tr('qappointment.layout.updateCategory'),
          requestParams: {include: 'parent'}
        },
        delete: true,
        formLeft: {
          id: {value: ''},
          userId: {value: this.$store.state.quserAuth.userId},
          title: {
            value: '',
            type: 'input',
            isTranslatable: true,
            props: {
              label: `${this.$tr('ui.form.title')}*`,
              rules: [
                val => !!val || this.$tr('ui.message.fieldRequired')
              ],
            },
          },
          slug: {
            value: '',
            type: 'input',
            props: {
              label: `${this.$tr('ui.form.slug')}*`,
              rules: [
                val => !!val || this.$tr('ui.message.fieldRequired')
              ],
            }
          },
          formId: {
            type: 'crud',
            props: {
              crudType: 'select',
              crudData: import('@imagina/qform/_crud/crudForms'),
              crudProps: {
                label: `${this.$tr('ui.label.form')}`,
              },
              config: {
                options: {
                  label: 'title', value: 'id'
                }
              },
            },
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
        formRight: {
          parentId: {
            value: 0,
            type: 'select',
            props: {
              label: `${this.$tr('ui.form.parent')}*`,
              options: [
                {label: this.$tr('ui.label.disabled'), value: 0},
              ],
            },
            loadOptions: {
              apiRoute: 'apiRoutes.qappointment.categories',
              select: {label: 'title', id: 'id'},
              requestParams: {include: 'parent'}
            }
          },
          mediasSingle: {
            name: 'mediasSingle',
            value: {},
            type: 'media',
            props: {
              label: this.$tr('ui.form.firstImage'),
              zone: 'mainimage',
              entity: "Modules\\Iappointment\\Entities\\Category",
              entityId: null
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
