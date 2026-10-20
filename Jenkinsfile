pipeline {
    agent any
    tools { nodejs 'node22' }
    options {
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }
    // GitHub Webhook 到达后检查仓库更新；任务 SCM 分支设为 main。
    triggers { githubPush() }
    stages {
        stage('构建与部署 Web') {
            steps { sh 'sh deploy/jenkins-build.sh' }
        }
    }
}
