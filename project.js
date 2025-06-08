let currentPoll = null;
        let votes = {};
        let pollOptions = [];
        let users = new Set();
        let pollHistory = [];
        let pollTimer = null;
        let timeLeft = 0;
        let selectedOption = null;
        let chart = null;

        function initChart() {
            const ctx = document.getElementById('resultsChart').getContext('2d');
            chart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [
                            '#667eea', '#764ba2', '#f093fb', '#f5576c',
                            '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
                            '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3'
                        ],
                        borderWidth: 3,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                font: {
                                    size: 14
                                }
                            }
                        }
                    }
                }
            });
        }


        function generateSessionCode() {
            return Math.random().toString(36).substr(2, 6).toUpperCase();
        }


        function addOption() {
            const container = document.getElementById('optionsContainer');
            const index = container.children.length;
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'poll-option-input';
            input.placeholder = `Option ${index + 1}`;
            input.setAttribute('data-index', index);
            container.appendChild(input);
        }


        function createPoll() {
            const question = document.getElementById('pollQuestion').value.trim();
            const timerMinutes = parseInt(document.getElementById('pollTimer').value);
            
            if (!question) {
                alert('Please enter a poll question!');
                return;
            }


            const optionInputs = document.querySelectorAll('.poll-option-input');
            pollOptions = [];
            
            optionInputs.forEach(input => {
                const value = input.value.trim();
                if (value) {
                    pollOptions.push(value);
                }
            });

            if (pollOptions.length < 2) {
                alert('Please enter at least 2 poll options!');
                return;
            }


            currentPoll = {
                question: question,
                options: pollOptions,
                sessionCode: generateSessionCode(),
                startTime: new Date(),
                timer: timerMinutes
            };


            votes = {};
            pollOptions.forEach(option => {
                votes[option] = 0;
            });


            document.getElementById('sessionCode').textContent = currentPoll.sessionCode;
            document.getElementById('sessionInfo').style.display = 'block';
            document.getElementById('createPollBtn').disabled = true;
            document.getElementById('endPollBtn').disabled = false;
            document.getElementById('sessionStatus').textContent = 'Active';


            if (timerMinutes > 0) {
                timeLeft = timerMinutes * 60;
                document.getElementById('timerDisplay').style.display = 'block';
                startTimer();
            }

            updateChart();
            updateStats();


            setTimeout(() => {
                users.add('User_' + Math.random().toString(36).substr(2, 5));
                updateStats();
            }, 2000);
        }


        function startTimer() {
            document.getElementById('timeRemaining').textContent = formatTime(timeLeft);
            
            pollTimer = setInterval(() => {
                timeLeft--;
                document.getElementById('timeRemaining').textContent = formatTime(timeLeft);
                
                if (timeLeft <= 0) {
                    endPoll();
                }
            }, 1000);
        }


        function formatTime(seconds) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }


        function endPoll() {
            if (!currentPoll) return;


            if (pollTimer) {
                clearInterval(pollTimer);
                pollTimer = null;
            }


            pollHistory.unshift({
                question: currentPoll.question,
                options: currentPoll.options,
                votes: {...votes},
                totalVotes: Object.values(votes).reduce((a, b) => a + b, 0),
                endTime: new Date()
            });


            document.getElementById('createPollBtn').disabled = false;
            document.getElementById('endPollBtn').disabled = true;
            document.getElementById('sessionInfo').style.display = 'none';
            document.getElementById('timerDisplay').style.display = 'none';
            document.getElementById('sessionStatus').textContent = 'Inactive';

            currentPoll = null;
            updateHistory();
            updateStats();
        }


        function joinSession() {
            const sessionCode = document.getElementById('userSessionCode').value.trim().toUpperCase();
            const userName = document.getElementById('userName').value.trim() || 'Anonymous';

            if (!sessionCode) {
                showUserMessage('Please enter a session code!', 'warning');
                return;
            }

            if (!currentPoll || currentPoll.sessionCode !== sessionCode) {
                showUserMessage('Invalid session code or session not active!', 'warning');
                return;
            }


            users.add(userName);
            updateStats();


            document.getElementById('userPollSection').style.display = 'block';
            document.getElementById('userPollQuestion').textContent = currentPoll.question;
            
            const optionsContainer = document.getElementById('userPollOptions');
            optionsContainer.innerHTML = '';
            
            currentPoll.options.forEach((option, index) => {
                const optionDiv = document.createElement('div');
                optionDiv.className = 'poll-option';
                optionDiv.textContent = option;
                optionDiv.onclick = () => selectOption(index, optionDiv);
                optionsContainer.appendChild(optionDiv);
            });

            showUserMessage('Successfully joined the session!', 'success');
        }


        function selectOption(index, element) {

            document.querySelectorAll('.poll-option').forEach(opt => {
                opt.classList.remove('selected');
            });


            element.classList.add('selected');
            selectedOption = index;
            document.getElementById('submitVoteBtn').disabled = false;
        }


        function submitVote() {
            if (selectedOption === null || !currentPoll) return;

            const optionText = currentPoll.options[selectedOption];
            votes[optionText]++;
            

            updateChart();
            updateStats();


            document.getElementById('submitVoteBtn').disabled = true;
            document.querySelectorAll('.poll-option').forEach(opt => {
                opt.style.pointerEvents = 'none';
                opt.style.opacity = '0.7';
            });

            showUserMessage('Vote submitted successfully!', 'success');


            setTimeout(() => {
                if (currentPoll && Math.random() > 0.5) {
                    const randomOption = currentPoll.options[Math.floor(Math.random() * currentPoll.options.length)];
                    votes[randomOption]++;
                    updateChart();
                    updateStats();
                }
            }, Math.random() * 3000 + 1000);
        }


        function showUserMessage(message, type) {
            const messageDiv = document.getElementById('userStatusMessage');
            messageDiv.className = `status-message status-${type}`;
            messageDiv.textContent = message;
            messageDiv.style.display = 'block';

            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 4000);
        }


        function updateChart() {
            if (!chart || !currentPoll) return;

            const labels = Object.keys(votes);
            const data = Object.values(votes);

            chart.data.labels = labels;
            chart.data.datasets[0].data = data;
            chart.update('none');
        }


        function updateStats() {
            const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
            document.getElementById('totalVotes').textContent = totalVotes;
            document.getElementById('activeUsers').textContent = users.size;
        }


        function updateHistory() {
            const historyContainer = document.getElementById('sessionHistory');
            
            if (pollHistory.length === 0) {
                historyContainer.innerHTML = '<p style="text-align: center; color: #666;">No completed sessions yet.</p>';
                return;
            }

            historyContainer.innerHTML = '';
            
            pollHistory.forEach((poll, index) => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                
                const winner = Object.keys(poll.votes).reduce((a, b) => 
                    poll.votes[a] > poll.votes[b] ? a : b
                );
                
                historyItem.innerHTML = `
                    <strong>Q: ${poll.question}</strong><br>
                    <small>Total Votes: ${poll.totalVotes} | Winner: ${winner} (${poll.votes[winner]} votes)</small><br>
                    <small>Ended: ${poll.endTime.toLocaleString()}</small>
                `;
                
                historyContainer.appendChild(historyItem);
            });
        }


        document.addEventListener('DOMContentLoaded', function() {
            initChart();
            

            setTimeout(() => {
                users.add('Demo User 1');
                users.add('Demo User 2');
                updateStats();
            }, 1000);
        });