import zxcvbn from 'zxcvbn';

const StrengthMapping = {
    0: {
        class: 'danger',
        width: '10%',
        status: 'Çox Zəif'
    },
    1: {
        class: 'danger',
        width: '25%',
        status: 'Çox Zəif'
    },
    2: {
        class: 'warning',
        width: '50%',
        status: 'Zəif'
    },
    3: {
        class: 'success',
        width: '75%',
        status: 'Yaxşı'
    },
    4: {
        class: 'success',
        width: '100%',
        status: 'Çox Yaxşı'
    }
}

const Progress = document.getElementById("password-strength-container")
const ProgressBar = document.getElementById("password-strength-bar")
const StrengthDescription = document.getElementById("password-strength-description")

const updatePasswordStrength = (e) => {
    const candidate = e.target.value
    // If there is no password, clear out the progress bar
    if (!candidate) {
        ProgressBar.style.width = 0
        StrengthDescription.textContent = ""
        Progress.classList.add("hidden")
        return
    }
    const score = zxcvbn(candidate).score
    const evaluation = StrengthMapping[score]
    // Update the progress bar
    ProgressBar.classList = `progress-bar progress-bar-${evaluation.class}`
    ProgressBar.style.width = evaluation.width
    StrengthDescription.textContent = evaluation.status
    StrengthDescription.classList = `text-${evaluation.class}`
    Progress.classList.remove("hidden")
}

document.getElementById("password").addEventListener("input", updatePasswordStrength)