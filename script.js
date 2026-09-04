// AOS init
AOS.init({ duration: 700, once: true, offset: 100 });

// Flip the hero image on click
$(document).on('click', '#heroFlip .flip-inner', function(){
  $(this).toggleClass('flipped');
});

const USERS_KEY = 'bmw_users';
const AUTH_KEY  = 'bmw_auth';

// ---- Auth UI ----
function getUsers(){ return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); }
function setUsers(u){ localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
function setAuth(user){ localStorage.setItem(AUTH_KEY, JSON.stringify(user)); updateAuthUI(); }
function getAuth(){ return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); }
function signOut(){ localStorage.removeItem(AUTH_KEY); updateAuthUI(); }

function updateAuthUI(){
  const u = getAuth();
  if(u){
    $('#btnOpenSignin').closest('li').addClass('d-none');
    $('#btnOpenSignup').closest('li').addClass('d-none');
    $('#userName').text(u.name.split(' ')[0]);
    $('#userMenu').removeClass('d-none');
  }else{
    $('#userMenu').addClass('d-none');
    $('#btnOpenSignin').closest('li').removeClass('d-none');
    $('#btnOpenSignup').closest('li').removeClass('d-none');
  }
}
$('#btnSignOut').on('click', function(e){ e.preventDefault(); signOut(); });

// Modal mode switching
const authModal = document.getElementById('authModal');
authModal.addEventListener('show.bs.modal', (ev)=>{
  const mode = ev.relatedTarget?.dataset?.mode || 'signin';
  setMode(mode);
});
$('#linkToSignup').on('click', function(e){ e.preventDefault(); setMode('signup'); });
$('#linkToSignin').on('click', function(e){ e.preventDefault(); setMode('signin'); });

function setMode(mode){
  if(mode === 'signup'){
    $('#authTitle').text('Create Account');
    $('#signinForm').addClass('d-none');
    $('#signupForm').removeClass('d-none');
  } else {
    $('#authTitle').text('Sign In');
    $('#signupForm').addClass('d-none');
    $('#signinForm').removeClass('d-none');
  }
}

// Sign Up
$('#signupForm').on('submit', function(e){
  e.preventDefault();
  const name = $('#upName').val().trim();
  const email = $('#upEmail').val().trim().toLowerCase();
  const pass = $('#upPass').val();
  if(!name || !email || pass.length < 6){ $('#signupMsg').text('Please complete all fields (password ≥ 6).'); return; }
  const users = getUsers();
  if(users.find(u => u.email === email)){ $('#signupMsg').text('Email already registered. Try Sign In.'); return; }
  users.push({ name, email, pass });
  setUsers(users);
  setAuth({ name, email });
  $('#signupMsg').removeClass('text-danger').addClass('text-success').text('Account created! You are signed in.');
  setTimeout(()=> bootstrap.Modal.getInstance(authModal).hide(), 650);
});

// Sign In
$('#signinForm').on('submit', function(e){
  e.preventDefault();
  const email = $('#inEmail').val().trim().toLowerCase();
  const pass = $('#inPass').val();
  const users = getUsers();
  const found = users.find(u => u.email === email && u.pass === pass);
  if(!found){ $('#signinMsg').text('Invalid credentials.'); return; }
  setAuth({ name: found.name, email: found.email });
  $('#signinMsg').removeClass('text-danger').addClass('text-success').text('Welcome back!');
  setTimeout(()=> bootstrap.Modal.getInstance(authModal).hide(), 500);
});

// ---- Cars Data ----
let ALL_CARS = [];

function fmtPrice(n){
  if(typeof n === 'string') return n;
  return '$' + Number(n).toLocaleString();
}

function buildFeatured(cars){
  const wrapper = $('#featuredWrapper');
  wrapper.empty();
  cars.forEach(c=>{
    const slide = $(`
      <div class="swiper-slide">
        <div class="slide-card">
          <img src="${c.image}" alt="${c.name}">
          <div class="p-3">
            <div class="fw-bold">${c.name}</div>
            <div class="text-muted small mb-2">${c.type} • ${c.year}</div>
            <div class="fw-bold text-primary">${fmtPrice(c.price)}</div>
          </div>
        </div>
      </div>
    `);
    wrapper.append(slide);
  });

  // init / re-init Swiper
  if(window._swiper) { window._swiper.destroy(true,true); }
  window._swiper = new Swiper('.mySwiper', {
    loop:true, centeredSlides:true, slidesPerView:1.1, spaceBetween:16,
    breakpoints:{ 768:{slidesPerView:2.2}, 992:{slidesPerView:3} },
    autoplay:{ delay:2600 }, pagination:{ el:'.swiper-pagination', clickable:true },
    navigation:{ nextEl:'.swiper-button-next', prevEl:'.swiper-button-prev' }
  });
}

function buildListings(cars){
  const list = $('#carList');
  list.empty();
  if(!cars.length){
    list.html('<div class="col-12 text-center text-muted py-5">No models match your filter.</div>');
    return;
  }

  cars.forEach(c=>{
    const card = $(`
      <div class="col-sm-6 col-lg-4 col-xl-3" data-aos="fade-up">
        <div class="card car h-100 position-relative">
          <span class="price-badge">${fmtPrice(c.price)}</span>
          <div class="flip-card">
            <div class="flip-inner" style="height:180px">
              <div class="flip-face front"><img src="${c.image}" alt="${c.name}" style="width:100%;height:180px;object-fit:cover"></div>
              <div class="flip-face back">
                <div class="p-3 h-100 d-flex flex-column justify-content-center text-center" style="background:#0b1224;color:#fff">
                  <div class="mb-2 fw-bold">${c.name}</div>
                  <div class="small text-white-50">Tap to flip back</div>
                </div>
              </div>
            </div>
          </div>
          <div class="p-3">
            <h6 class="mb-1">${c.name}</h6>
            <div class="text-muted small mb-2">${c.type} • ${c.year}</div>
            <div class="specs">
              <span class="tag"><i class="fa-solid fa-horse-head me-1"></i>${c.horsepower}</span>
              <span class="tag"><i class="fa-solid fa-gauge-high me-1"></i>${c.topSpeed}</span>
              <span class="tag"><i class="fa-solid fa-stopwatch me-1"></i>${c.acceleration}</span>
            </div>
          </div>
        </div>
      </div>
    `);
    list.append(card);
  });
}

// flip behavior on cards
$(document).on('click', '.card.car .flip-inner', function(){ $(this).toggleClass('flipped'); });

// filters
$('#searchBox').on('input', applyFilters);
$('#typeFilter').on('change', applyFilters);

function applyFilters(){
  const q = $('#searchBox').val().trim().toLowerCase();
  const t = $('#typeFilter').val();
  let items = ALL_CARS.slice();
  if(q){
    items = items.filter(c => (${c.name} ${c.type} ${c.year}).toLowerCase().includes(q));
  }
  if(t){ items = items.filter(c => c.type.toLowerCase() === t.toLowerCase()); }
  buildListings(items);
}

// load cars.json
function loadCars(){
  $.getJSON('cars.json')
    .done(data=>{
      ALL_CARS = data;
      buildFeatured(ALL_CARS);           // all in featured as requested
      buildListings(ALL_CARS);
    })
    .fail(()=> {
      // Fallback demo if JSON can't load (e.g., opened as file://)
      ALL_CARS = [
        {name:'BMW M5 Competition', price:105000, image:'https://images.unsplash.com/photo-1600486913747-55e5470a6b9a?q=80&w=1200&auto=format&fit=crop', horsepower:'625 hp', acceleration:'0–100 km/h in 3.3s', topSpeed:'305 km/h', type:'Sedan', year:2024},
        {name:'BMW i8 Roadster', price:147500, image:'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1200&auto=format&fit=crop', horsepower:'369 hp', acceleration:'0–100 km/h in 4.4s', topSpeed:'250 km/h', type:'Coupe', year:2020},
        {name:'BMW X7 M60i', price:121000, image:'https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=1200&auto=format&fit=crop', horsepower:'530 hp', acceleration:'0–100 km/h in 4.7s', topSpeed:'250 km/h', type:'SUV', year:2024},
        {name:'BMW M4 CSL', price:139900, image:'https://images.unsplash.com/photo-1511910849309-2e8e4f0b0a15?q=80&w=1200&auto=format&fit=crop', horsepower:'550 hp', acceleration:'0–100 km/h in 3.6s', topSpeed:'307 km/h', type:'Coupe', year:2023},
      ];
      buildFeatured(ALL_CARS);
      buildListings(ALL_CARS);
    });
}

// footer year + initial auth UI
$('#year').text(new Date().getFullYear());
updateAuthUI();
loadCars();