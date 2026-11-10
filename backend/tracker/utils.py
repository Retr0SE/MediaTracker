import requests
from django.conf import settings
from django.core.cache import cache

def fetch_omdb_info(title, media_type, imdb_id=None):
    cache_key = f"omdb_{imdb_id}" if imdb_id else f"omdb_{title.replace(' ', '_')}_{media_type}"
    cached_movie = cache.get(cache_key)
    if cached_movie:
        print(f"REDIS: OMDb data for {cache_key} fetched from cache.")
        return cached_movie

    print(f"OMDB API: Fetching data from external source...")

    if media_type == 'movie':
        omdb_type = 'movie'
    elif media_type == 'series':
        omdb_type = 'series'
    else:
        return {}

    url = "http://www.omdbapi.com/"
    params = {
        'apikey': settings.OMDB_API_KEY,
        'type': omdb_type,
        'plot': 'full'

    }

    if imdb_id:
        params['i'] = imdb_id
    else:
        params['t'] = title

    try:
        response = requests.get(url, params=params)

        print('Status OMDb: ', response.status_code)
        print('Response OMDb: ', response.text)


        if response.status_code == 200:
            data = response.json()
            if data.get('Response') == 'True':
                poster = data.get('Poster')
                poster_url = poster if poster != 'N/A' else None

                year_str = str(data.get('Year', '')).strip()
                year = year_str if year_str else None

                plot = data.get('Plot')
                description = plot if plot != 'N/A' else ''

                runtime_raw = str(data.get("Runtime", ''))
                runtime_isdigit = ''.join([char for char in runtime_raw if char.isdigit()])
                runtime = int(runtime_isdigit) if runtime_isdigit else None

                seasons_str = data.get('totalSeasons')
                seasons = int(seasons_str) if seasons_str and seasons_str.isdigit() else None


                genre_str = data.get('Genre')
                genre = genre_str if genre_str != "N/A" else ''

                imdb = data.get('imdbRating')
                imdb_rating = imdb if imdb != "N/A" else None

                director = data.get('Director')
                director_val = director if director != "N/A" else None

                actors = data.get('Actors')
                actors_val = actors if actors != "N/A" else None

                awards_str = data.get('Awards')
                awards = awards_str if awards_str != "N/A" else None

                country_str = data.get('Country')
                country = country_str if country_str != "N/A" else None

                language_str = data.get('Language')
                language = language_str if language_str != "N/A" else None
                

                result_data = {
                    'title': data.get('Title'),
                    'imdb_id': data.get('imdbID'),
                    'poster_url': poster_url,
                    'release_year': year,
                    'description': description,
                    'runtime': runtime, 
                    'seasons': seasons,
                    'genre': genre,
                    'imdb_rating': imdb_rating,
                    'director': director_val,
                    'actors': actors_val,
                    'awards': awards,
                    'country': country,
                    'language': language,
                }

            cache.set(cache_key, result_data, timeout=2592000)
            return result_data
    except Exception as e:
        print(f'OMDb error: {e}')
    return {}
