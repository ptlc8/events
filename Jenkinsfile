pipeline {
    agent any

    parameters {
        string(name: 'PORTAL_CONNECT_URL', defaultValue: params.PORTAL_CONNECT_URL ?: null, description: 'Ambi portal connect URL')
        string(name: 'PORTAL_USER_URL', defaultValue: params.PORTAL_USER_URL ?: null, description: 'Ambi portal user URL')
        string(name: 'MAPBOX_ACCESS_TOKEN', defaultValue: params.MAPBOX_ACCESS_TOKEN ?: null, description: 'Mapbox access token')
        string(name: 'AGGREGATION_WEBHOOK_URL', defaultValue: params.AGGREGATION_WEBHOOK_URL ?: null, description: 'Aggregation webhook URL')
        string(name: 'DATATOURISME_GET_URL', defaultValue: params.DATATOURISME_GET_URL ?: null, description: 'Datatourisme get URL')
        string(name: 'OPENAGENDA_KEY', defaultValue: params.OPENAGENDA_KEY ?: null, description: 'Openagenda API key')
        string(name: 'MONTREAL_CSV_URL', defaultValue: params.MONTREAL_CSV_URL ?: 'https://donnees.montreal.ca/dataset/6a4cbf2c-c9b7-413a-86b1-e8f7081e2578/resource/6decf611-6f11-4f34-bb36-324d804c9bad/download/evenements.csv', description: 'Montreal CSV URL')
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