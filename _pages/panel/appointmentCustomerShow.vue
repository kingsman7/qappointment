<template>
  <div id="appointmentIndexPage">
    <div id="appointmentIndexPageContent">
      <div class="box relative-position">
        <!--Top Content-->
        <div v-if="appointment" class="row justify-between">
          <!--Title-->
          <div class="box-title">
            <q-icon name="fas fa-calendar-check"/>
            {{ appointment.category.title }}
          </div>
          <!--Actions-->
          <q-btn-dropdown flat color="blue-grey" dropdown-icon="fas fa-ellipsis-v" round unelevated
                          v-if="appointmentActions.length">
            <q-list>
              <q-item v-for="(action, keyItem) in appointmentActions" :key="keyItem" clickable v-close-popup
                      @click="action.action()">
                <q-item-section>
                  <q-item-label>{{ action.title }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
        <!--Form report error-->
        <q-dialog v-model="modalReportError" persistent v-if="formErrorId">
          <q-card id="dialogInformation" class="bg-grey-1">
            <!--Header-->
            <q-toolbar class="bg-primary text-white">
              <q-toolbar-title>
                <label>{{ $tr('iappointment.cms.message.reportError') }}</label>
              </q-toolbar-title>
              <q-btn flat v-close-popup icon="fas fa-times"/>
            </q-toolbar>

            <!--Content-->
            <q-card-section class="relative-position col-12">
              <dynamic-form :form-id="formErrorId" @sent="modalReportError = false"
                            :send-to="{apiRoute : 'apiRoutes.qform.leads', extraData : {formId : formErrorId}}"/>
            </q-card-section>
          </q-card>
        </q-dialog>
        <!--Separator-->
        <q-separator class="q-mt-sm q-mb-md"/>
        <!---Message-->
        <div v-if="process.name == 'message'">
          <div class="text-center">
            <!--Icon-->
            <q-icon :name="process.message.icon" :color="process.message.color" size="40px" class="q-mb-md"/>
            <!--Message-->
            <div v-html="process.message.text" class="q-mb-md"></div>
            <!--Actions-->
            <div class="row q-gutter-x-md justify-center full-width">
              <!--Action Re take appointme-->
              <q-btn :label="$tr('iappointment.cms.message.resumAppointment')" rounded unelevated color="amber"
                     no-caps padding="xs md" @click="updateAppointmentStatus(1)" v-if="process.status == 4"/>
              <!--Action got to appointment list-->
              <q-btn :label="$tr('iappointment.cms.message.appointmentList')" rounded unelevated color="green"
                     no-caps :to="{name : 'qappointment.main.appointments.index'}" padding="xs md"/>
            </div>
          </div>
        </div>
        <!--Form-->
        <dynamic-form v-model="form" v-if="process.name == 'form'" @submit="sendForm"
                      v-bind="(process.status == 2) ? formProps.appointment : formProps.rating"/>
        <!--Chat-->
        <advance-chat height="calc(100vh - 280px)" v-if="process.name == 'chat'" v-bind="chatProps"/>
        <!--Inner loading-->
        <inner-loading :visible="loading"/>
      </div>
    </div>
  </div>
</template>
<script>
//Components
import advanceChat from '@imagina/qchat/_components/advancedChat'

export default {
  beforeDestroy() {
    this.$root.$off('page.data.refresh')
    this.$eventBus.$off('iappointment.appoinment.was.changed')
  },
  props: {},
  components: {advanceChat},
  watch: {},
  mounted() {
    this.$nextTick(function () {
      this.init()
    })
  },
  data() {
    return {
      loading: false,
      modalReportError: false,
      appointment: false,
      form: {}
    }
  },
  computed: {
    //Form Error report action
    formErrorId() {
      return this.$store.getters['qsiteApp/getSettingValueByName']('iappointment::errorFormRelated')
    },
    //Appoinment actions
    appointmentActions() {
      let response = []

      //Add report error action
      if (this.formErrorId) response.push({
        name: 'reportError',
        title: this.$tr('iappointment.cms.message.reportError'),
        action: (params) => {
          this.modalReportError = true
        }
      })

      //Response
      return response
    },
    //Appointment status
    process() {
      let fields = this.appointment.fields || []//Get appointment fields
      let status = parseInt(this.appointment.statusId || 0)

      //Available Process
      let availableProcess = {
        0: 'message',//Default
        1: 'message',//Pending
        2: 'form',//in progress-pre (se envia al iappointment)
        3: 'chat',//in progress-conversation
        4: 'message',//Abandoned
        5: 'message',//Expired
        6: fields.find(item => item.name == 'rating') ? 'message' : 'form'//Completed
      }

      //Avalaible Message
      let availableMessages = {
        0: {//Default
          text: this.$tr('isite.cms.message.notFound'),
          icon: 'power_off',
          color: 'red'
        },
        1: {//Pending
          text: this.$tr('iappointment.cms.message.assigningMessage'),
          icon: 'fas fa-user-clock',
          color: 'primary'
        },
        4: {//Abandoned
          text: this.$tr('iappointment.cms.message.abandonedMessage'),
          icon: 'fas fa-user-lock',
          color: 'amber'
        },
        5: {//Expired
          text: this.$tr('iappointment.cms.message.expiredMessage'),
          icon: 'fas fa-user-clock',
          color: 'red'
        },
        6: {//Complete
          text: this.$tr('iappointment.cms.message.completedMessage'),
          icon: 'fas fa-user-check',
          color: 'green'
        }
      }

      //Response
      return {
        status: status,
        name: availableProcess[status],
        message: availableMessages[status]
      }
    },
    //Form props
    formProps() {
      return {
        //Appointment form
        appointment: {
          formId: this.appointment ? this.appointment.category.formId : false,
          ref: 'appointmentForm'
        },
        //Ratign form
        rating: {
          ref: 'appointmentForm',
          title: this.$tr('isite.cms.message.rateYour', {name: this.appointment ? this.appointment.category.title : ''}),
          blocks: [
            {
              fields: {
                rating: {
                  value: 1,
                  type: 'rating',
                  colClass: 'col-12',
                  required: true,
                  props: {
                    label: this.$tr('isite.cms.label.rating')
                  }
                },
                ratingComments: {
                  value: null,
                  type: 'input',
                  colClass: 'col-12',
                  props: {
                    label: `${this.$tr('isite.cms.label.comment')}...`,
                    type: 'textarea',
                    rows: "3"
                  }
                }
              }
            }
          ]
        }
      }
    },
    //Chat props
    chatProps() {
      return {
        roomId: (this.appointment && this.appointment.conversation) ? this.appointment.conversation.id : false,
        ref: 'appointmentChat',
        loadRooms: (this.appointment && this.appointment.conversation) ? true : false
      }
    },
    //Appointment data
    appointmentData() {
      //Get appointment
      let appointment = this.$clone(this.appointment)

      //Response
      return response
    }
  },
  methods: {
    async init() {
      this.listenEvents()
      await this.getData()
    },
    //Listen pusher message
    listenEvents() {
      //Refresh page
      this.$root.$on('page.data.refresh', () => {
        this.getData(true)
      })
      //Appintment completed
      this.$eventBus.$on('iappointment.appoinment.was.changed', (response) => {
        this.getData(true)
      })
    },
    //Get data
    getData(refresh = false) {
      return new Promise((resolve, reject) => {
        this.loading = true
        //Requets params
        let requestParams = {
          refresh: true,
          params: {
            include: 'category,conversation,fields'
          }
        }

        //Request
        this.$crud.show('apiRoutes.qappointment.appointments', this.$route.params.id, requestParams).then(response => {
          this.appointment = response.data//Set appointment data
          this.loading = false
          resolve(response.data)
        }).catch(error => {
          this.loading = false
          reject(error)
        })
      })
    },
    //Update appointment status
    updateAppointmentStatus(statusId = false) {
      return new Promise((resolve, reject) => {
        //Validate if status id it's valid
        if (!statusId || !this.appointment) return reject(false)
        //Request Data
        let requestData = {
          statusId: statusId
        }
        //Request
        this.$crud.update('apiRoutes.qappointment.appointments', this.appointment.id, requestData).then(response => {
          this.getData()//Get appointment
          resolve(response.data)
        }).catch(error => {
          reject(error)
        })
      })
    },
    //Send form
    sendForm() {
      return new Promise((resolve, reject) => {
        this.loading = true
        //Request data
        let requestData = {
          appointmentId: this.$route.params.id,
          ...this.form
        }
        //Request
        this.$crud.create('apiRoutes.qappointment.appointmentLeads', requestData).then(response => {
          this.$refs.appointmentForm.reset()//Reset form
          this.form = {}//Reset form
          this.getData()//Get appointment data
        }).catch(error => {
          this.loading = false
        })
      })
    }
  }
}
</script>
<style lang="stylus">
</style>
