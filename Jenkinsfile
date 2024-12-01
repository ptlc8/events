def aggregationProviders = [
    [name: 'Datatourisme', envVars: ['DATATOURISME_GET_URL'], command: 'datatourisme'],
    [name: 'Openagenda', envVars: ['OPENAGENDA_KEY'], command: 'openagenda']
]

pipeline {
    agent any

    parameters {
        string(name: 'PORTAL_CONNECT_URL', defaultValue: params.PORTAL_CONNECT_URL ?: null, description: 'Ambi portal connect URL')
        string(name: 'PORTAL_USER_URL', defaultValue: params.PORTAL_USER_URL ?: null, description: 'Ambi portal user URL')
        string(name: 'VITE_MAPBOX_ACCESS_TOKEN', defaultValue: params.VITE_MAPBOX_ACCESS_TOKEN ?: null, description: 'Mapbox access token')
        string(name: 'AGGREGATION_WEBHOOK_URL', defaultValue: params.AGGREGATION_WEBHOOK_URL ?: null, description: 'Aggregation webhook URL')
        string(name: 'DATATOURISME_GET_URL', defaultValue: params.DATATOURISME_GET_URL ?: null, description: 'Datatourisme get URL')
        string(name: 'OPENAGENDA_KEY', defaultValue: params.OPENAGENDA_KEY ?: null, description: 'Openagenda API key')
    }

    triggers {
        cron((0 ..< aggregationProviders.size()).join(',') + ' H * * *')
    }

    stages {
        stage('Build') {
            when {
                not {
                    triggeredBy 'TimerTrigger'
                }
            }
            steps {
                sh 'docker compose build'
            }
        }

        stage('Deploy') {
            when {
                not {
                    triggeredBy 'TimerTrigger'
                }
            }
            steps {
                sh 'docker compose up --remove-orphans -d web-server'
            }
        }

        stage('Dynamic Aggregation Stages') {
            when {
                triggeredBy 'TimerTrigger'
            }
            steps {
                script {
                    def index = new Date().getMinutes()
                    def provider = aggregationProviders[index]
                    echo "Creating aggregation stage for ${provider.name}"
                    if (provider.envVars.every { env[it] }) {
                        stage(provider.name + ' aggregation') {
                            steps {
                                echo "Aggregating data from ${provider.name}"
                                status = getStatus(sh(
                                    script: "docker compose run aggregator ${provider.command}",
                                    returnStatus: true
                                ))
                                sh 'docker compose rm -f'
                                if (env.AGGREGATION_WEBHOOK_URL) {
                                    sh "curl -X POST -H 'Content-Type: application/json' -d '{\"content\": \"${provider.name} aggregation ${status}\"}' ${params.AGGREGATION_WEBHOOK_URL}"
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

def getStatus(success) {
    return success
        ? 'SUCCESS ' + ['🍏', '🥬', '💚', '📗'].shuffle().first() 
        : 'FAILURE ' + ['🍎', '❤', '📕', '🍅'].shuffle().first()
}