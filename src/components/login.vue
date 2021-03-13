<template>
    <div id="login-main">
        <h3 class="mb-4">Welcome</h3>
        <div
            class="login-alert"
            variant="danger"
            v-show="noUserAlert"
        >
            No User Found!
        </div>
        <div
            class="login-alert"
            variant="danger"
            v-show="invalidPasswordAlert"
        >
            Invalid Password!
        </div>
        <div
            class="login-alert"
            variant="danger"
            v-show="serverErrorAlert"
        >
            Server Error!
        </div>
        <b-form-input
            class="mb-3"
            v-model="username"
            size="sm"
            placeholder="Username">
        </b-form-input>
        <b-form-input
            class="mb-3"
            v-model="password"
            size="sm"
            placeholder="Password"
            type="password"
            @keydown.enter.prevent="login"
        ></b-form-input>
        <b-button variant="primary" @click="login">
            <b-spinner small v-show="submitting"></b-spinner>
            Login
        </b-button>
    </div>
</template>

<script>
	export default {
        data() {
            return {
                username: '',
                password: '',
                noUserAlert: false,
                invalidPasswordAlert: false,
                serverErrorAlert: false,
                submitting: false
            }
        },
        methods: {
            login: function () {
                this.noUserAlert = false;
                this.invalidPasswordAlert = false;
                this.serverErrorAlert = false;
                this.submitting = true;

                this.axios({
                    method: 'POST',
                    url: '/server/authApi/login',
                    data: {
                        username: this.username,
                        password: this.password
                    }
                })
                .then(res => res.data)
                .then(({ token, user }) => {
                    localStorage.setItem('jwt', token)
                    localStorage.setItem('user', JSON.stringify(user));

                    if (localStorage.getItem('jwt') != null){
                        const { nextUrl } = this.$route.query;
                        if(nextUrl != null){
                            this.$router.push(nextUrl);
                        }
                        else {
                            this.$router.push({ name: 'home' });
                        }
                    }

                    this.submitting = false;
                })
                .catch(error => {
                    const status = error.response.status;
                    switch (status) {
                        case 404:
                            this.noUserAlert = true;
                            break;
                        case 401:
                            this.invalidPasswordAlert = true;
                            break;
                        default:
                            this.serverErrorAlert = true;
                    }

                    this.submitting = false;
                });
            }
        }
    }
</script>
