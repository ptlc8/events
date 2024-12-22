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

    stages {
        stage('Build') {
            steps {
                sh 'docker compose build'
            }
        }

        stage('Deploy') {
            steps {
                sh 'docker compose up --remove-orphans -d'
            }
        }
    }
}