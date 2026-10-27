pipeline {
    agent any

    environment {
        COMPOSE_PROJECT_NAME = 'kanak-turnkey'
        DOCKER_BUILDKIT = '1'
    }

    stages {
        stage('1. Checkout Code') {
            steps {
                echo 'Checking out latest code from repository...'
                checkout scm
            }
        }

        stage('2. Prepare Environment') {
            steps {
                echo 'Checking .env configuration...'
                sh '''
                    if [ ! -f .env ]; then
                        echo "Creating .env from .env.example..."
                        cp .env.example .env
                        RANDOM_SECRET=$(head -c 32 /dev/urandom | xxd -p)
                        sed -i "s/your_secure_64_byte_hex_session_secret_here/$RANDOM_SECRET/" .env
                    fi
                '''
            }
        }

        stage('3. Run Core Verification Tests') {
            steps {
                echo 'Running financial, BOQ, and 3-way match validation tests...'
                sh '''
                    docker run --rm -v $(pwd):/app -w /app node:20-alpine node ./scripts/test-core-calculations.js
                '''
            }
        }

        stage('4. Build Docker Images') {
            steps {
                echo 'Building backend, frontend, and database Docker containers...'
                sh 'docker compose build --parallel'
            }
        }

        stage('5. Deploy Application') {
            steps {
                echo 'Deploying containers with zero downtime...'
                sh 'docker compose up -d --remove-orphans'
            }
        }

        stage('6. Health Check') {
            steps {
                echo 'Verifying application health...'
                sh '''
                    sleep 10
                    docker compose ps
                    curl -f http://localhost/api/health || (echo "Health check failed!" && exit 1)
                    echo "Application is live and healthy!"
                '''
            }
        }
    }

    post {
        always {
            echo 'Pipeline execution complete.'
            sh 'docker image prune -f || true'
        }
        success {
            echo 'SUCCESS: Kanak TurnKey ERP successfully deployed!'
        }
        failure {
            echo 'FAILURE: Deployment encountered errors. Check Jenkins console logs.'
        }
    }
}
