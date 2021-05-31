<template>
  <div id="appointmentIndexPage">
    <div id="appointmentIndexPageContent">
      <div class="box relative-position">
        <!--Title-->
        <div class="box-title" v-if="appointment">
          <q-icon name="fas fa-calendar-check"/>
          {{ appointment.category.title }}
          <q-separator class="q-mt-sm q-mb-md"/>
        </div>
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
              <q-btn :label="$tr('qappointment.layout.message.resumAppointment')" rounded unelevated color="amber"
                     no-caps padding="xs md" @click="updateAppointmentStatus(1)" v-if="process.status == 4"/>
              <!--Action got to appointment list-->
              <q-btn :label="$tr('qappointment.layout.message.appointmentList')" rounded unelevated color="green"
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
      appointment: false,
      form: {}
    }
  },
  computed: {
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
          text: this.$tr('ui.message.notFound'),
          icon: 'power_off',
          color: 'red'
        },
        1: {//Pending
          text: this.$tr('qappointment.layout.message.assigningMessage'),
          icon: 'fas fa-user-clock',
          color: 'primary'
        },
        4: {//Abandoned
          text: this.$tr('qappointment.layout.message.abandonedMessage'),
          icon: 'fas fa-user-lock',
          color: 'amber'
        },
        5: {//Expired
          text: this.$tr('qappointment.layout.message.expiredMessage'),
          icon: 'fas fa-user-clock',
          color: 'red'
        },
        6: {//Complete
          text: this.$tr('qappointment.layout.message.completedMessage'),
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
          title: this.$tr('ui.message.rateYour', {name: this.appointment ? this.appointment.category.title : ''}),
          blocks: [
            {
              fields: {
                rating: {
                  value: 1,
                  type: 'rating',
                  colClass: 'col-12',
                  required: true,
                  props: {
                    label: this.$tr('ui.label.rating')
                  }
                },
                ratingComments: {
                  value: null,
                  type: 'input',
                  colClass: 'col-12',
                  props: {
                    label: `${this.$tr('ui.label.comment')}...`,
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
