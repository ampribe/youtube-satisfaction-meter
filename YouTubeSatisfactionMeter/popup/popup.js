/*
Show/hide rating and metrics sections
*/
  
const ratingSelector = document.getElementById("rating-selector");
const ratingSectionWrapper = document.getElementById("rating-section-wrapper");

const metricsSelector = document.getElementById("metrics-selector");
const metricsSectionWrapper = document.getElementById("metrics-section-wrapper");

ratingSelector.addEventListener(
    "click",
    () => {
        if (ratingSectionWrapper.classList.contains("hidden")) {
            metricsSectionWrapper.classList.add("hidden");
            updateRateVideoWrapper();
            ratingSectionWrapper.classList.remove("hidden");
        } else {
            ratingSectionWrapper.classList.add("hidden");
        }
    }
)

metricsSelector.addEventListener(
    "click",
    () => {
        if (metricsSectionWrapper.classList.contains("hidden")) {
            ratingSectionWrapper.classList.add("hidden");
            updateMetricsSection();
            metricsSectionWrapper.classList.remove("hidden");            
        } else {
            metricsSectionWrapper.classList.add("hidden");
        }
    }
)

/*
Video and display utils
*/
async function getVideos() {
    const response = await browser.storage.local.get()
    return Array.from(Object.values(response));
}

function removeVideo(id) {
    browser.storage.local.remove(id);
}

function rateVideo(rating, id) {
    browser.storage.local.get(id).then((resp)=>{
        resp[Object.keys(resp)[0]].rating = rating;
        browser.storage.local.set(resp).then(updateRateVideoWrapper())
      });
}

function getVideoHeading(video) {
    return `
    <img src="https://img.youtube.com/vi/${video.id}/mqdefault.jpg" title="${video.title}" alt="${video.title}"/>
    <div class="title-wrapper">
        <a class="video-title" href="https://www.youtube.com/watch?v=${video.id}">${video.title}</a>
    </div>`;
}

/*
construct and display metrics section
*/

async function updateMetricsSection() {
    const videos = await getVideos();
    const ratedVideos = videos.filter((video) => video.rating != null)
    metricsSectionWrapper.innerHTML = "";
    if (ratedVideos.length == 0) {
        metricsSectionWrapper.innerHTML = `<p class='rate-text' id="metrics-message">You haven't rated any videos!</p>`;
        return;
    }
    metricsSectionWrapper.innerHTML = `
    <canvas id="metrics-canvas"></canvas>`;
    const ctx = document.getElementById('metrics-canvas').getContext('2d');
    ctx.width = 400;
    ctx.height = 1000;
    const chart = new Chart(ctx, { type: 'bar' });
    updateChart(ratedVideos, chart);
    var wrapper = document.createElement("div");
    wrapper.classList.add("video-section-wrapper");
    constructMetricsVideos(ratedVideos, wrapper);
    var videoSection = document.createElement("div");
    videoSection.classList.add("videos-wrapper");
    videoSection.innerHTML = `<p class='videos-heading'>Watched Videos</p>`;
    videoSection.appendChild(wrapper);
    metricsSectionWrapper.appendChild(videoSection);
}

function constructMetricsVideos(videos, wrapper) {
    videos.forEach(video => {
        wrapper.appendChild(constructViewVideoWrapper(video));
    });
}

function constructViewVideoWrapper(video) {
    const c = `view-${video.rating}-rating`;
    const wrapper = document.createElement("div");
    wrapper.classList.add("rate-video-wrapper");
    const map = { regret: "Regret", meh: "Meh", satisfied: "Satisfied"};
    wrapper.innerHTML = `
    ${getVideoHeading(video)}
    <div class="rating-wrapper">
        <div class="${c}">${map[video.rating]}</div>
        <div class="access-type-button">${video.accessMethod}</div>
        <div class="remove-video-wrapper">
            <input type="image" src="../icons/trash.png" video-id="${video.id}"/>
        </div>
    </div>`;
    wrapper.addEventListener('click', event => {
        if (event.target.tagName == "INPUT") {
            let id = event.target.getAttribute("video-id");
            removeVideo(id);
            updateMetricsSection();
        }
      });
    return wrapper;
}

/*
Construct and display rate video section
*/
async function updateRateVideoWrapper() {
    var videos = await getVideos();
    videos = videos.filter((video) => video.rating == null)
    if (videos.length == 0) {
        ratingSectionWrapper.innerHTML = "<p class='rate-text'>No videos to rate!</p>";
        return;
    }
    ratingSectionWrapper.innerHTML = "";
    videos.forEach(video => {
        ratingSectionWrapper.appendChild(constructRateVideoWrapper(video));
    });
}

function constructRateVideoWrapper(video) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("rate-video-wrapper");
    wrapper.innerHTML = `
    ${getVideoHeading(video)}
    <div class="rating-wrapper">
        <button class="regret-rating" video-id="${video.id}" id="regret-${video.id}">Regret</button>
        <button class="meh-rating" video-id="${video.id}" id="meh-${video.id}">Meh</button>
        <button class="satisfied-rating" video-id="${video.id}" id="satisfied-${video.id}">Satisfied</button>
        <div class="remove-video-wrapper">
            <input type="image" src="../icons/trash.png" video-id="${video.id}" id="remove-${video.id}">
        </div>
    </div>
    `;
    wrapper.querySelector(`#regret-${video.id}`).addEventListener("click", (event) => {
        let id = event.target.getAttribute("video-id");
        rateVideo("regret", id)
    });
    wrapper.querySelector(`#meh-${video.id}`).addEventListener("click", (event) => {
        let id = event.target.getAttribute("video-id");
        rateVideo("meh", id);
    });
    wrapper.querySelector(`#satisfied-${video.id}`).addEventListener("click", (event) => {
        let id = event.target.getAttribute("video-id");
        rateVideo("satisfied", id);
    });
    wrapper.addEventListener("click", (event) => {
        if (event.target.tagName == "INPUT") {
            let id = event.target.getAttribute("video-id");
            removeVideo(id);
            updateRateVideoWrapper();
        }
    });
    return wrapper;
}

/*
Initialize and update chart
*/

function updateChart(videos, chart) {
    var tot = 0;
    var data = {};
    for (const video of videos) {
        if (video.rating != null) {
            if (data[video.accessMethod] == null) {
                data[video.accessMethod] = {}
            } 
            if (data[video.accessMethod][video.rating] == null) {
                data[video.accessMethod][video.rating] = 0;
            }
            data[video.accessMethod][video.rating] += 1;
            tot += 1;
        }
    }
    var labels = Array.from(Object.keys(data));
    var cols = {
        satisfied: new Array(labels.length).fill(0),
        meh: new Array(labels.length).fill(0),
        regret: new Array(labels.length).fill(0),
    }
    for (const i in labels) {
        for (var key of Object.keys(data[labels[i]])) {
            cols[key][i] += data[labels[i]][key];
        }
    }
    data = {
        labels: labels,
        datasets: [
            {
                label: 'Regret',
                data: cols.regret,
                backgroundColor: 'rgba(255, 0, 0, 1)',
            },
            {
                label: 'Meh',
                data: cols.meh,
                backgroundColor: 'rgba(0, 0, 255, 1)',
            },
            {
                label: 'Satisfied',
                data: cols.satisfied,
                backgroundColor: 'rgba(50, 200, 55, 1)',
            },
        ]
    };
    const options = {
        scale: {
            ticks: {
                precision:0
              }
        },
        plugins: {
          title: {
            display: true,
            text: `Videos by source, total = ${tot}`
              },
          },
          responsive: true,
          scales: {
              x: {
                  stacked: true,
              },
              y: {
                  stacked: true
              }
          }
    };
    chart.options = options;
    chart.data = data;
    chart.update();
}

