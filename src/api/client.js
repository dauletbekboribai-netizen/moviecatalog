const BASE_URL = "http://localhost:3001";

const getToken = () => localStorage.getItem("token");

const headers = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${getToken()}`
});

export const getMovies = () => {
  return fetch(`${BASE_URL}/movies`).then(res => res.json());
};

export const getMovie = async (id) => {
  const movieRes = await fetch(`${BASE_URL}/movies/${id}`);
  const movie = await movieRes.json();
  
  const actorsRes = await fetch(`${BASE_URL}/movie_actors?movieId=${id}`);
  const movieActors = await actorsRes.json();
  
  const actors = await Promise.all(
    movieActors.map(async (ma) => {
      const actorRes = await fetch(`${BASE_URL}/actors/${ma.actorId}`);
      return actorRes.json();
    })
  );
  
  return { ...movie, actors };
};

export const getActors = () => {
  return fetch(`${BASE_URL}/actors`).then(res => res.json());
};

export const addActorToMovie = async (movieId, actorId) => {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/movie_actors`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({ movieId, actorId })
  });
  return res.json();
};

export const removeActorFromMovie = async (movieId, actorId) => {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/movie_actors?movieId=${movieId}&actorId=${actorId}`);
  const relations = await res.json();
  if (relations.length > 0) {
    await fetch(`${BASE_URL}/movie_actors/${relations[0].id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }
};

export const createActor = async (data) => {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/actors`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify(data)
  });
  return res.json();
};

export const getMoviesByActor = async (actorId) => {
  const relationsRes = await fetch(`${BASE_URL}/movie_actors?actorId=${actorId}`);
  const relations = await relationsRes.json();
  
  const movies = await Promise.all(
    relations.map(async (r) => {
      const movieRes = await fetch(`${BASE_URL}/movies/${r.movieId}`);
      return movieRes.json();
    })
  );
  return movies;
};

export const getGenres = () => {
  return fetch(`${BASE_URL}/genres`).then(res => res.json());
};

export const getGenre = (id) => {
  return fetch(`${BASE_URL}/genres/${id}`).then(res => res.json());
};

export const createMovie = (data) => {
  return fetch(`${BASE_URL}/movies`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(data)
  }).then(res => res.json());
};

export const updateMovie = (id, data) => {
  return fetch(`${BASE_URL}/movies/${id}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(data)
  }).then(res => res.json());
};

export const deleteMovie = async(movieId)=>{
 const token=getToken()
 const relations=
  await fetch(
   `${BASE_URL}/movie_actors?movieId=${movieId}`
  ).then(r=>r.json())
 for(const relation of relations){
  await fetch(
   `${BASE_URL}/movie_actors/${relation.id}`,
   {
    method:"DELETE",
    headers:{
     Authorization:`Bearer ${token}`
    }
   }
  )
  const actorRelations=
   await fetch(
    `${BASE_URL}/movie_actors?actorId=${relation.actorId}`
   ).then(r=>r.json())
  if(actorRelations.length===0){
   await fetch(
    `${BASE_URL}/actors/${relation.actorId}`,
    {
     method:"DELETE",
     headers:{
      Authorization:`Bearer ${token}`
     }
    }
   )
  }
 }
 await fetch(
  `${BASE_URL}/movies/${movieId}`,
  {
   method:"DELETE",
   headers:{
    Authorization:`Bearer ${token}`
   }
  }
 )
}

export const getReviews = (movieId) => {
  return fetch(`${BASE_URL}/reviews?movieId=${movieId}`).then(res => res.json());
};

export const createReview = (data) => {
  const token = getToken();
  return fetch(`${BASE_URL}/reviews`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  }).then(res => res.json());
};

export const deleteReview = (id) => {
  const token = getToken();
  return fetch(`${BASE_URL}/reviews/${id}`, {
    method: "DELETE",
    headers: { 'Authorization': `Bearer ${token}` }
  });
};

export const getUsers = () => {
  return fetch(`${BASE_URL}/users`, { headers: headers() }).then(res => res.json());
};

export const updateUser = (id, data) => {
  return fetch(`${BASE_URL}/users/${id}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify(data)
  }).then(res => res.json());
};

export const deleteUser = (id) => {
  return fetch(`${BASE_URL}/users/${id}`, {
    method: "DELETE",
    headers: headers()
  });
};

export const getAverageRating = (reviews) => {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return (sum / reviews.length).toFixed(1);
};