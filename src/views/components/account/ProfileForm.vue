<template>
  <b-card header="Update Profile"
          class="form">
    <alert :data="error" />

    <successalert message="Profile update successful!"
                  :show="success" />

    <b-form @submit.prevent="updateProfile">
      <b-form-group label="Firstname"
                    label-for="input_firstname">
        <b-input id="input_firstname"
                 v-model="user.firstName" />
      </b-form-group>

      <b-form-group label="Lastname"
                    label-for="input_lastname">
        <b-input id="input_lastname"
                 v-model="user.lastName" />
      </b-form-group>

      <b-form-group label="E-Mail"
                    label-for="input_email">
        <b-input id="input_email" 
                 v-model="user.email"
                 type="email" />
      </b-form-group>

      <b-form-group label="Password"
                    label-for="input_password">
        <b-input id="input_password"
                 v-model="user.password"
                 type="password" />
      </b-form-group>

      <b-btn type="submit"
             variant="primary">
        Update
      </b-btn>
    </b-form>
  </b-card>
</template>

<script>
import Alert from '@/components/misc/ErrorAlert.vue'
import SuccessAlert from '@/components/misc/SuccessAlert.vue'

export default {
  name: 'ProfileForm',
  components: {
    alert: Alert,
    successalert : SuccessAlert,
  },
  data() {
    return {
      error: null,
      success: false,
    }
  },
  computed: {
    user() {
      return JSON.parse(JSON.stringify(this.$store.getters.getUser))
    },
  },
  created() {
    this.$store.dispatch('getCurrentUser', {
      id: this.$store.getters.getCurrentUser.user.id,
    }).catch((error) => {
      this.error = error
    })
  },
  methods: {
    updateProfile() {
      this.$store.dispatch('updateProfile', this.user)
        .then( () => {
          this.success = true
        })
        .catch((error) => {
          this.error = error
        })
    },
  },
}
</script>