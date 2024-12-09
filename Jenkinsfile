def aggregationProviders = [
    [name: 'Datatourisme', envVars: ['DATATOURISME_GET_URL'], command: 'datatourisme'],
    [name: 'Openagenda', envVars: ['OPENAGENDA_KEY'], command: 'openagenda']
]

def cronExpression = (0 ..< aggregationProviders.size()).collect { "${it} H * * *" }.join("\n")

pipeline {
    agent any

    parameters {
        string(name: 'PORTAL_CONNECT_URL', defaultValue: params.PORTAL_CONNECT_URL ?: null, description: 'Ambi portal connect URL')
        string(name: 'PORTAL_USER_URL', defaultValue: params.PORTAL_USER_URL ?: null, description: 'Ambi portal user URL')
        string(name: 'MAPBOX_ACCESS_TOKEN', defaultValue: params.MAPBOX_ACCESS_TOKEN ?: null, description: 'Mapbox access token')
        string(name: 'AGGREGATION_WEBHOOK_URL', defaultValue: params.AGGREGATION_WEBHOOK_URL ?: null, description: 'Aggregation webhook URL')
        string(name: 'DATATOURISME_GET_URL', defaultValue: params.DATATOURISME_GET_URL ?: null, description: 'Datatourisme get URL')
        string(name: 'OPENAGENDA_KEY', defaultValue: params.OPENAGENDA_KEY ?: null, description: 'Openagenda API key')
    }

    triggers {
        cron(cronExpression)
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
                    if (provider.envVars.every { env.getProperty(it) }) {
                        echo "All required environment variables are set for ${provider.name}"
                        stage(provider.name + ' aggregation') {
                            echo "Aggregating data from ${provider.name}"
                            status_code = sh(
                                script: "docker compose run --rm aggregator ${provider.command}",
                                returnStatus: true
                            )
                            echo "Status code: ${status_code}"
                            status = getStatus(status_code == 0)
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


def getStatus(success) {
    green_emojis = ['🍏', '🥬', '💚', '📗', '🍀', '🌱']
    red_emojis = ['🍎', '❤', '📕', '🍅', '🍒', '🍓']
    return success
        ? 'SUCCESS ' + green_emojis[new Random().nextInt(green_emojis.size())]
        : 'FAILURE ' + red_emojis[new Random().nextInt(red_emojis.size())]
}