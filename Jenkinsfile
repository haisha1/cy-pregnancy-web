pipeline {
    agent any
    tools { nodejs 'node22' }
    options {
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }
    stages {
        stage('构建与部署 Web') {
            steps { sh 'sh deploy/jenkins-build.sh' }
        }
    }
}
