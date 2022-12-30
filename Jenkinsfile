pipeline {
    agent any

    environment {
        dockerImage = ''
        APP_NAME = 'hwanstory-frontend'
        IMAGE_NAME = 'akon47/hwanstory-frontend'
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        GITHUB_CREDENTIALS_ID = 'git-hub'
        DOCKER_CREDENTIALS_ID = 'docker-hub'
    }

    stages {
        stage('Clone') {
            steps {
                echo 'Clonning Repository'
                git url: 'git@github.com:akon47/hwanstory.git', branch: 'master', credentialsId: GITHUB_CREDENTIALS_ID, changelog: false
            }
            post {
                success {
                    echo 'Successfully Cloned Repository'
                }
                failure {
                    error 'This pipeline stops here...'
                }
            }
        }

        stage('Bulid Docker') {
            steps {
                echo 'Bulid Docker'
                script {
                    dockerImage = docker.build("${IMAGE_NAME}")
                }
            }
            post {
                failure {
                    error 'This pipeline stops here...'
                }
            }
        }

        stage('Push Docker') {
            steps {
                echo 'Push Docker'
                script {
                    docker.withRegistry('', DOCKER_CREDENTIALS_ID) {
                        dockerImage.push("${IMAGE_TAG}")
                        dockerImage.push("latest")
                    }
                }
            }
            post {
                success {
                    sh 'docker rmi $(docker images -q -f dangling=true) || true'
                }
                failure {
                    error 'This pipeline stops here...'
                }
            }
        }

        stage('Docker Run') {
            steps {
                echo 'Pull Docker Image & Docker Image Run'
                sshagent(credentials: ['ssh']) {
                    sh "ssh -o StrictHostKeyChecking=no kimhwan@10.10.10.100 'docker pull ${IMAGE_NAME}'"
                    sh "ssh -o StrictHostKeyChecking=no kimhwan@10.10.10.100 'docker ps -q -a --filter name=${APP_NAME} | grep -q . && docker rm -f \$(docker ps -aq --filter name=${APP_NAME}) || true'"
                    sh "ssh -o StrictHostKeyChecking=no kimhwan@10.10.10.100 'docker run -d --restart always --name ${APP_NAME} -v /var/www/html/sitemap:/usr/share/nginx/html/sitemap -v /var/www/html/static:/usr/share/nginx/html/static --net=host ${IMAGE_NAME}'"
                    sh "ssh -o StrictHostKeyChecking=no kimhwan@10.10.10.100 'docker images -qf dangling=true | xargs -I{} docker rmi {} || true'"
                    sh "ssh -o StrictHostKeyChecking=no kimhwan@10.10.10.100 'docker rmi ${IMAGE_NAME}:${IMAGE_TAG} || true'"
                }
            }
            post {
                failure {
                    error 'This pipeline stops here...'
                }
            }
        }
    }
}
