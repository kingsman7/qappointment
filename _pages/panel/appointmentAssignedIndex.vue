<template>
  <div id="appointmentAssignedIndex">
    <div id="appointmentAssignedIndexContent" class="box" style="padding: 0">
      <!--Chat-->
      <advanced-chat :rooms-id="assignedConversations.conversationsId"
                     @room-opened="roomId => selectedRommId = $clone(roomId)"
                     :advanced-props="advancedChatProps" v-if="!loading" height="calc(100vh - 200px)"
                     :load-rooms="assignedConversations.conversationsId.length ? true : false"/>
      <!--Dialog Information-->
      <q-dialog v-model="modal.show">
        <q-card id="dialogInformation" class="bg-grey-1" v-if="appointmentSelected">
          <!--Header-->
          <q-toolbar class="bg-primary text-white">
            <q-toolbar-title>
              <label>{{ modal.title }}</label>
            </q-toolbar-title>
            <q-btn class="q-hide q-md-show" flat v-close-popup icon="fas fa-times"/>
          </q-toolbar>

          <!--Content-->
          <q-card-section class="relative-position col-12">
            <!--Information Fields-->
            <div v-if="modal.type == 'showInformation'">
              <div class="appt-card__fields-field q-py-xs"
                   v-for="(field, keyField) in (appointmentSelected.fields || [])"
                   :key="keyField">
                <label class="text-grey-7 q-mr-xs">{{ field.name }}:</label><label>{{ field.value }}</label>
              </div>
            </div>
            <!--Field-->
            <div v-else>
              <!--Field-->
              <dynamic-field v-model="fieldValue[modal.type]" :field="actionsFields[modal.type]" class="q-mb-md"/>
              <!--Actions-->
              <div class="text-right">
                <q-btn :label="$tr('ui.label.save')" icon="fas fa-save" rounded unelevated color="green"
                       @click="updateAppointment"/>
              </div>
            </div>
            <!--Inner loading-->
            <inner-loading :visible="modal.loading"/>
          </q-card-section>
        </q-card>
      </q-dialog>
      <!--Form report error-->
      <q-dialog v-model="modalReportError" persistent v-if="formErrorId">
        <q-card id="dialogInformation" class="bg-grey-1" v-if="appointmentSelected">
          <!--Header-->
          <q-toolbar class="bg-primary text-white">
            <q-toolbar-title>
              <label>{{ $tr('qappointment.layout.message.reportError') }}</label>
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
      <!--inner-loading-->
      <inner-loading :visible="loading"/>
    </div>
  </div>
</template>
<script>
import advancedChat from '@imagina/qchat/_components/advancedChat'

export default {
  beforeDestroy() {
    this.$root.$off('page.data.refresh')
    this.$eventBus.$off('iappointment.appoinment.was.changed')
  },
  props: {},
  components: {advancedChat},
  watch: {},
  mounted() {
    this.$nextTick(function () {
      this.init()
    })
  },
  data() {
    return {
      loading: false,
      appointments: [],
      selectedRommId: false,
      modal: {
        loading: false,
        show: false,
        title: false,
        type: false
      },
      modalReportError: false,
      fieldValue: {
        addRecommendation: null,
        changeStatus: null,
      }
    }
  },
  computed: {
    //Form Error report action
    formErrorId() {
      return this.$store.getters['qsiteApp/getSettingValueByName']('iappointment::errorFormRelated')
    },
    //Get conversations from appointments
    assignedConversations() {
      let response = {conversations: [], conversationsId: []}//Default response
      let appointments = this.$clone(this.appointments)

      if (appointments) {
        //Get appointments with conversations
        let apptWithConversations = appointments.filter(appt => appt.conversation)
        //Get only conversations
        let conversations = apptWithConversations.map(appointment => appointment.conversation)
        //Add to response
        response = {
          conversations: conversations,
          conversationsId: conversations.map(item => item.id)
        }
      }

      //Response
      return this.$clone(response)
    },
    //Get appointment from room selected
    appointmentSelected() {
      //Validate if exist selected room
      if (!this.selectedRommId) return false
      //Get appointments with conversations
      let apptWithConversations = this.$clone(this.appointments.filter(appt => appt.conversation))
      //Response
      return apptWithConversations.find(appt => appt.conversation.id = this.selectedRommId)
    },
    //advance chat props
    advancedChatProps() {
      let response = {
        menuActions: [
          {
            name: 'showInformation',
            title: this.$tr('qappointment.layout.message.showInfo'),
            action: (params) => {
              this.modal = {
                show: true,
                title: this.appointmentSelected.customer.fullName,
                type: 'showInformation'
              }
            }
          },
          {
            name: 'changeStatus',
            title: this.$tr('qappointment.layout.message.changeStatus'),
            action: (params) => {
              this.modal = {
                show: true,
                title: this.$tr('qappointment.layout.message.changeStatus'),
                type: 'changeStatus'
              }
            }
          },
          {
            name: 'addRecommendation',
            title: this.$tr('qappointment.layout.message.addRecommendation'),
            action: (params) => {
              this.modal = {
                show: true,
                title: this.$tr('qappointment.layout.message.addRecommendation'),
                type: 'addRecommendation'
              }
            }
          }
        ]
      }

      //Add form error report action
      if (this.formErrorId) response.menuActions.push({
        name: 'reportError',
        title: this.$tr('qappointment.layout.message.reportError'),
        action: (params) => {
          this.modalReportError = true
        }
      })

      //Response
      return response
    },
    //Actions fields
    actionsFields() {
      //Get appointment recommendation
      let recommendation = this.appointmentSelected.options ? (this.appointmentSelected.options.recommendation || null) : null

      return {
        addRecommendation: {
          value: recommendation,
          type: 'html'
        },
        changeStatus: {
          value: null,
          type: 'select',
          props: {
            label: this.$tr('ui.form.status'),
            options: [
              {label: 'Abandonado', value: 4},
              {label: 'Completado', value: 6}
            ]
          }
        },
      }
    }
  },
  methods: {
    init() {
      this.listenEvents()
      this.getAppointments()
    },
    //Listen pusher message
    listenEvents() {
      //Refresh page
      this.$root.$on('page.data.refresh', () => {
        this.getAppointments(true)
      })
      //Appintment completed
      this.$eventBus.$on('iappointment.appoinment.was.changed', (response) => {
        this.$alert.info({
          mode: 'modal',
          message: this.$tr('qappointment.layout.message.newAssignationMessage'),
          actions: [
            {
              label: this.$tr('ui.label.refresh'),
              color: 'green',
              handler: () => this.getAppointments()
            }
          ]
        })
      })
    },
    //Get data
    getAppointments(refresh = false) {
      return new Promise((resolve, reject) => {
        this.loading = true
        //Requets params
        let requestParams = {
          refresh: true,
          params: {
            include: 'category,customer,assigned,status,fields,conversation',
            filter: {status: 3}//Request only appointments in progress
          }
        }
        //Request
        this.$crud.index('apiRoutes.qappointment.appointments', requestParams).then(response => {
          this.appointments = response.data
          this.loading = false
        }).catch(error => {
          this.loading = false
        })
      })
    },
    //Update Appointment
    updateAppointment() {
      this.modal.loading = true
      let requestData = this.$clone(this.appointmentSelected)
      //Set status
      if (this.modal.type == 'changeStatus') requestData.statusId = this.fieldValue.changeStatus
      //Set Recommendation
      if (this.modal.type == 'addRecommendation')
        requestData.options = {...(requestData.options || {}), recommendation: this.fieldValue.addRecommendation}

      //Request
      this.$crud.update('apiRoutes.qappointment.appointments', this.appointmentSelected.id, requestData).then(response => {
        //Reeplace local appointment data
        if (this.modal.type == 'addRecommendation')
          this.appointments.forEach((appt, index) => {
            if (appt.id == requestData.id) this.appointments[index] = this.$clone(requestData)
          })
        //refresh all appointment data
        if (this.modal.type == 'changeStatus') this.getAppointments()
        //Reset modal
        this.modal = {
          loading: false,
          show: false,
          title: false,
          type: false
        }
      }).catch(error => {
        this.modal.loading = false
      })
    }
  }
}
</script>
<style lang="stylus">
</style>
