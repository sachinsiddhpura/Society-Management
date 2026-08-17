pipeline {
    agent any

    parameters {
        string(name: 'APP_SERVER_HOST', defaultValue: '13.233.103.55',
               description: 'Public IP (or DNS) of the EC2 instance running the app via docker-compose')
        string(name: 'APP_SERVER_USER', defaultValue: 'ec2-user',
               description: 'SSH user on the app EC2 instance')
    }

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // Fast fail-safe check: does the backend even compile? This build is
        // NOT what gets deployed - the app EC2 rebuilds everything fresh
        // inside Docker in the Deploy stage. This just stops a broken commit
        // before it ever touches the production server.
        stage('Backend: compile & package') {
            steps {
                dir('backend') {
                    // Amazon Linux's `maven` package pulls in Java 17 as its own
                    // dependency, which would otherwise shadow the Java 21 this
                    // project requires. Point JAVA_HOME at the Corretto 21 devel
                    // package explicitly rather than relying on whatever `java`/
                    // `javac` happen to resolve to on PATH.
                    sh '''
                        export JAVA_HOME=$(dirname $(dirname $(rpm -ql java-21-amazon-corretto-devel | grep -m1 "bin/javac$")))
                        echo "Using JAVA_HOME=$JAVA_HOME"
                        mvn -B -DskipTests clean package
                    '''
                }
            }
        }

        // Same idea for the frontend - catches a broken build before deploy.
        stage('Frontend: install & build') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    sh 'npm run build'
                }
            }
        }

        stage('Deploy to AWS') {
            steps {
                sshagent(credentials: ['app-ec2-ssh-key']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${params.APP_SERVER_USER}@${params.APP_SERVER_HOST} '
                            set -e
                            cd ~/app &&
                            git fetch origin main &&
                            git reset --hard origin/main &&
                            cd deployment &&
                            docker compose up -d --build
                        '
                    """
                }
            }
        }

        stage('Verify') {
            steps {
                sshagent(credentials: ['app-ec2-ssh-key']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${params.APP_SERVER_USER}@${params.APP_SERVER_HOST} '
                            cd ~/app/deployment && docker compose ps
                        '
                    """
                }
            }
        }
    }

    post {
        success {
            echo "Deployed commit ${env.GIT_COMMIT} to ${params.APP_SERVER_HOST} successfully."
        }
        failure {
            echo 'Pipeline failed - check the stage logs above. If the Deploy stage did not run, the previously running deployment on the server was left untouched.'
        }
    }
}
