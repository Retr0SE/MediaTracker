import requests
from django.conf import settings

def fetch_omdb_info(title, media_type):
    if media_type == 'movie':
        omdb_type = 'movie'
    elif media_type in ['series', 'anime']:
        omdb_type = 'series'

    else:
        return {}

    url = "http://www.omdbapi.com/"
    params = {
        'apikey': settings.OMDB_API_KEY,
        't': title,
        'type': omdb_type,
        'plot': 'full'

    }

    try:
        response = requests.get(url, params=params)

        print('Статус OMDb: ', response.status_code)
        print('Відповідь OMDb: ', response.text)


        if response.status_code == 200:
            data = response.json()
            if data.get('Response') == 'True':
                poster = data.get('Poster')
                poster_url = poster if poster != 'N/A' else None

                year_str = str(data.get('Year', '')).strip()[:4]
                year = int(year_str) if year_str.isdigit() else None

                plot = data.get('Plot')
                description = plot if plot != 'N/A' else ''

                runtime = data.get("Runtime")
                if runtime and runtime != "N/A":
                    duration = int(runtime.split()[0])
                else:
                    duration = None

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
                

                return {
                    'poster_url': poster_url,
                    'release_year': year,
                    'description': description,
                    'duration': duration, 
                    'seasons': seasons,
                    'genre': genre,
                    'imdb_rating': imdb_rating,
                    'director': director_val,
                    'actors': actors_val,
                    'awards': awards,
                    'country': country,
                    'language': language,
                }
    except Exception as e:
        print(f'Помилка OMDb: {e}')
    return {}
