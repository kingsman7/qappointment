<template>
  <div id="appointmentAssignedIndex">
    <div id="appointmentAssignedIndexContent" class="box relative-position" style="padding: 0">
      <!--Chat-->
      <advanced-chat :rooms-id="assignedConversations.conversationsId"
                     @room-opened="roomId => selectedRommId = $clone(roomId)"
                     :advanced-props="advancedChatProps" v-if="!loading" height="calc(100vh - 200px)"
                     :load-rooms="assignedConversations.conversationsId.length ? true : false"/>
      <!--Dialog Information-->
      <master-modal v-model="modal.show" :title="modal.title || ''" :loading="modal.loading">
        <!--Content-->
        <div v-if="appointmentSelected">
          <!--Information Fields-->
          <div v-if="modal.type == 'showInformation'" class="box box-auto-height">
            <div v-for="(field, keyField) in (appointmentSelected.fields || [])"
                 :key="keyField" class="appt-card__fields-field q-py-xs">
              <label class="text-grey-7 q-mr-xs">{{ field.name }}:</label><label>{{ field.value }}</label>
            </div>
          </div>
          <!--Subscriptions-->
          <div v-else-if="modal.type == 'showSubscription'">
            <!--Empty-->
            <not-result v-if="!modal.loading && (!modal.data || !modal.data.length)"/>
            <!--Data-->
            <div v-for="(field, keyField) in (modal.data || [])"
                 :key="keyField" class="box box-auto-height q-py-xs q-mb-sm">
              <!--Name-->
              <div>
                <label class="text-grey-7 q-mr-xs">{{ $tr('isite.cms.form.name') }}:</label>
                <label>{{ field.name }}</label>
              </div>
              <!--Start Date-->
              <div>
                <label class="text-grey-7 q-mr-xs">{{ $tr('qplan.layout.form.startDate') }}:</label>
                <label>{{ $trd(field.startDate) }}</label>
              </div>
              <!--End Date-->
              <div>
                <label class="text-grey-7 q-mr-xs">{{ $tr('qplan.layout.form.endDate') }}:</label>
                <label>{{ $trd(field.endDate) }}</label>
              </div>
            </div>
          </div>
          <!--Form-->
          <div v-else class="box box-auto-height">
            <!--Field-->
            <dynamic-field v-model="fieldValue[modal.type]" :field="actionsFields[modal.type]" class="q-mb-md"/>
            <!--Actions-->
            <div class="text-right">
              <q-btn :label="$tr('isite.cms.label.save')" icon="fas fa-save" rounded unelevated color="green"
                     @click="updateAppointment"/>
            </div>
          </div>
        </div>
      </master-modal>
      <!--Form report error-->
      <master-modal v-model="modalReportError" :title="$tr('iappointment.cms.message.reportError')"
                    :loading="modal.loading">
        <!--Content-->
        <dynamic-form :form-id="formErrorId" @sent="modalReportError = false" v-if="formErrorId && appointmentSelected"
                      :send-to="{apiRoute : 'apiRoutes.qform.leads', extraData : {formId : formErrorId}}"/>
      </master-modal>
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
        type: false,
        data: false
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
            title: this.$tr('iappointment.cms.message.showInfo'),
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
            title: this.$tr('iappointment.cms.message.changeStatus'),
            action: (params) => {
              this.modal = {
                show: true,
                title: this.$tr('iappointment.cms.message.changeStatus'),
                type: 'changeStatus'
              }
            }
          },
          {
            name: 'addRecommendation',
            title: this.$tr('iappointment.cms.message.addRecommendation'),
            action: (params) => {
              this.modal = {
                show: true,
                title: this.$tr('iappointment.cms.message.addRecommendation'),
                type: 'addRecommendation'
              }
            }
          }
        ]
      }

      //Add show customer ssubscriptions action
      if (this.$auth.hasAccess('iplan.subscriptions.index')) response.menuActions.push({
        name: 'showSubscriptions',
        title: this.$tr('iappointment.cms.message.showSubscriptions'),
        action: (params) => {
          //Set data modal
          this.modal = {
            show: true,
            title: this.$trp('isite.cms.label.subscription'),
            type: 'showSubscription',
            loading: true,
            data: false
          }
          //Get customer subscriptions
          this.getCustomerSubscriptions()
        }
      },)

      //Add form error report action
      if (this.formErrorId) response.menuActions.push({
        name: 'reportError',
        title: this.$tr('iappointment.cms.message.reportError'),
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
            label: this.$tr('isite.cms.form.status'),
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
          message: this.$tr('iappointment.cms.message.newAssignationMessage'),
          actions: [
            {
              label: this.$tr('isite.cms.label.refresh'),
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
    },
    //Get user subscriptions
    getCustomerSubscriptions() {
      return new Promise((resolve, reject) => {
        //Request params
        let requestParams = {
          //refresh: true,
          params: {
            filter: {
              user: this.appointmentSelected.customerId,
              status: 1
            }
          }
        }
        //Request
        this.$crud.index('apiRoutes.qplan.subscriptions', requestParams).then(response => {
          this.modal.loading = false
          this.modal.data = response.data
        }).catch(error => {
          this.modal.loading = false
          reject(error)
        })
      })
    }
  }
}
</script>
<style lang="stylus">
</style>
