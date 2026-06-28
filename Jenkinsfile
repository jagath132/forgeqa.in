pipeline {
    agent any

    tools {
        nodejs "NodeJS 22"
    }

    environment {
        MONGO_URI       = credentials('mongo-uri')
        MONGO_DB_NAME   = 'nextest_ci'
        JWT_SECRET      = credentials('jwt-secret')
        ENCRYPTION_SECRET = credentials('encryption-secret')
        CORS_ORIGIN     = 'https://nextest.app'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Typecheck') {
            steps {
                sh 'npm run typecheck'
            }
        }

        stage('Lint') {
            steps {
                sh 'npm run lint'
            }
        }

        stage('Build Frontend') {
            steps {
                sh 'npm run build'
            }
            post {
                success {
                    stash name: 'build', includes: 'dist/**'
                }
            }
        }

        stage('Test') {
            steps {
                sh '''
                    docker rm -f nextest-mongo 2>/dev/null || true
                    docker run -d --name nextest-mongo -p 27017:27017 mongo:7
                '''
                sh '''
                    for i in $(seq 1 30); do
                        docker exec nextest-mongo mongosh --eval "db.runCommand({ ping: 1 })" && break
                        sleep 1
                    done
                '''
                sh 'npm test'
            }
            post {
                always {
                    sh 'docker rm -f nextest-mongo || true'
                }
            }
        }

        stage('Deploy Backend') {
            when { branch 'main' }
            steps {
                withCredentials([string(credentialsId: 'railway-token', variable: 'RAILWAY_TOKEN')]) {
                    sh '''
                        npm install -g @railway/cli
                        railway login --token $RAILWAY_TOKEN
                        railway up --service nextest-api --detach
                    '''
                }
            }
        }

        stage('Deploy Frontend') {
            when { branch 'main' }
            steps {
                unstash 'build'
                withCredentials([string(credentialsId: 'vercel-token', variable: 'VERCEL_TOKEN')]) {
                    sh '''
                        npm install -g vercel
                        vercel --prod --token $VERCEL_TOKEN --yes
                    '''
                }
            }
        }
    }

    post {
        failure {
            emailext(
                to: 'team@example.com',
                subject: "ForgeQA Pipeline Failed: #${env.BUILD_NUMBER}",
                body: "Branch: ${env.BRANCH_NAME}\nURL: ${env.BUILD_URL}"
            )
        }
    }
}
