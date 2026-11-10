import json
import os
import shutil
import yt_dlp
import requests
import unicodedata
import re
import time

def format_name(name):
    if not name:
        return ""
    formatted = name.lower()
    formatted = unicodedata.normalize('NFD', formatted)
    formatted = formatted.encode('ascii', 'ignore').decode('utf-8')
    formatted = re.sub(r'\s+', '_', formatted)
    formatted = re.sub(r'[^a-z0-9_]', '', formatted)
    return formatted

def get_character_img_path(name):
    return f"img/characters/{format_name(name)}.jpg"

def get_stand_img_path(name):
    return f"img/stands/{format_name(name)}.jpg"

def get_cover_img_path(song_name):
    return f"img/covers/cover_{format_name(song_name)}.jpg"

def get_audio_path(audio_value_from_json):
    filename = audio_value_from_json.replace("audio/", "")
    return f"audio/tracks/{filename}"

def migrate_existing_file(old_path, new_path):
    if os.path.exists(new_path):
        return
    
    legacy_img_path = f"img/{os.path.basename(new_path)}"
    legacy_audio_path = old_path

    if new_path.startswith("img/") and os.path.exists(legacy_img_path):
        os.makedirs(os.path.dirname(new_path), exist_ok=True)
        shutil.move(legacy_img_path, new_path)
        print(f"📦 Fichier déplacé : {legacy_img_path} -> {new_path}")
    elif new_path.startswith("audio/") and os.path.exists(legacy_audio_path):
        os.makedirs(os.path.dirname(new_path), exist_ok=True)
        shutil.move(legacy_audio_path, new_path)
        print(f"📦 Fichier déplacé : {legacy_audio_path} -> {new_path}")

def download_jojo_wiki_image(name, filepath, retries=3):
    if not name or os.path.exists(filepath):
        return
    
    print(f"🖼️  Recherche Wiki pour : {name}...")
    url = f"https://jojowiki.com/api.php?action=query&prop=pageimages&titles={name}&format=json&pithumbsize=500"
    
    for attempt in range(retries):
        try:
            res = requests.get(url, timeout=10).json()
            pages = res.get("query", {}).get("pages", {})
            
            for page_id, page_data in pages.items():
                if "thumbnail" in page_data:
                    img_url = page_data["thumbnail"]["source"]
                    img_data = requests.get(img_url, timeout=10).content
                    with open(filepath, 'wb') as f:
                        f.write(img_data)
                    print(f"   ✅ Image trouvée et sauvegardée : {filepath}")
                    return
            print(f"   ⚠️ Aucune image Wiki trouvée pour '{name}'")
            return
        except requests.exceptions.RequestException as e:
            print(f"   ⏳ Erreur réseau (Tentative {attempt + 1}/{retries}). Nouvelle tentative dans 3s...")
            time.sleep(3)
    print(f"   ❌ Échec de la connexion Wiki pour '{name}'")

def download_itunes_cover(artist, song, filepath, retries=3):
    if not artist or not song or os.path.exists(filepath):
        return
    
    query = f"{artist} {song}"
    print(f"🎵 Recherche Pochette pour : {query}...")
    url = f"https://itunes.apple.com/search?term={query}&entity=song&limit=1"
    
    for attempt in range(retries):
        try:
            res = requests.get(url, timeout=10).json()
            if res['resultCount'] > 0:
                img_url = res['results'][0]['artworkUrl100'].replace('100x100bb', '500x500bb')
                img_data = requests.get(img_url, timeout=10).content
                with open(filepath, 'wb') as f:
                    f.write(img_data)
                print(f"   ✅ Pochette sauvegardée : {filepath}")
                return
            print(f"   ⚠️ Aucune pochette trouvée sur iTunes pour '{query}'")
            return
        except requests.exceptions.RequestException as e:
            print(f"   ⏳ Erreur réseau iTunes (Tentative {attempt + 1}/{retries}). Nouvelle tentative dans 3s...")
            time.sleep(3)
    print(f"   ❌ Échec de la connexion iTunes pour '{query}'")

def filter_duration(info, *args, **kwargs):
    duration = info.get('duration')
    if duration and duration > 900: 
        return 'Vidéo trop longue, ignorée.'
    return None

def download_assets_from_json(json_filepath):
    print("🚀 Lancement du téléchargement des assets...")
    with open(json_filepath, 'r', encoding='utf-8') as file:
        data = json.load(file)

    os.makedirs("audio/tracks", exist_ok=True)
    os.makedirs("img/characters", exist_ok=True)
    os.makedirs("img/stands", exist_ok=True)
    os.makedirs("img/covers", exist_ok=True)

    for item in data:
        user = item.get("user")
        stand = item.get("stand")
        
        print(f"\n--- 👤 Traitement du personnage : {user} ---")
        
        # Téléchargement d'une seule image unique pour le personnage
        char_img_path = get_character_img_path(user)
        migrate_existing_file(f"img/{format_name(user)}.jpg", char_img_path)
        download_jojo_wiki_image(user, char_img_path)
        time.sleep(0.5)

        if stand:
            stand_img_path = get_stand_img_path(stand)
            migrate_existing_file(f"img/{format_name(stand)}.jpg", stand_img_path)
            download_jojo_wiki_image(stand, stand_img_path)
            time.sleep(0.5)

        tracks = item.get("tracks", [])
        for track in tracks:
            artist = track.get("artist", "")
            song = track.get("song", "")
            json_audio_path = track.get("audio") 
            new_audio_path = get_audio_path(json_audio_path)
            
            query = f"{artist} {song}".strip()
            if not query or not json_audio_path:
                continue

            cover_path = get_cover_img_path(song)
            migrate_existing_file(f"img/cover_{format_name(song)}.jpg", cover_path)
            download_itunes_cover(artist, song, cover_path)
            time.sleep(0.5)

            migrate_existing_file(json_audio_path, new_audio_path)
            
            if os.path.exists(new_audio_path):
                print(f"⏩ Audio déjà prêt : {new_audio_path}")
                continue

            print(f"⬇️ Téléchargement MP3 pour : {query}...")
            search_term = f"{query} official audio"
            search_query = f"ytsearch10:{search_term}"
            base_output_path = new_audio_path.rsplit('.', 1)[0]
            
            ydl_opts = {
                'format': 'bestaudio/best',
                'outtmpl': f'{base_output_path}.%(ext)s',
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '128',
                }],
                'match_filter': filter_duration,
                'max_downloads': 1, 
                'noplaylist': True,
                'quiet': True,
                'no_warnings': True
            }

            for attempt in range(3):
                try:
                    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                        ydl.download([search_query])
                    print(f"   ✅ Audio MP3 généré : {new_audio_path}")
                    break 
                except Exception as e:
                    if "Maximum number of downloads reached" in str(e):
                        print(f"   ✅ Audio MP3 généré : {new_audio_path}")
                        break
                    else:
                        print(f"   ⏳ Erreur YouTube (Tentative {attempt + 1}/3). Nouvelle tentative dans 3s...")
                        time.sleep(3)
                        if attempt == 2:
                            print(f"   ❌ Impossible de télécharger l'audio {query}")

if __name__ == "__main__":
    json_file = "data.json"
    if os.path.exists(json_file):
        download_assets_from_json(json_file)
    else:
        print(f"Le fichier {json_file} est introuvable.")