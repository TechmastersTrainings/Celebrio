"""
Karnataka location + function-hall dataset.

* All district headquarters and major taluk towns of Karnataka.
* Localities for the larger cities.
* Function / convention halls compiled from public listings (Justdial, Yappe,
  Mandap.com, WedMeGood, Mappls) in Nov 2026. They are imported as active so customers
  can find them while typing; admins can edit or deactivate any of them in
  Admin -> Venue Directory.

Idempotent (get_or_create), so re-running or editing in the admin is safe.
"""
from django.db import migrations
from django.utils import timezone

KARNATAKA_CITIES = [
    # District headquarters
    'Bagalkote', 'Ballari', 'Belagavi', 'Bengaluru', 'Bidar', 'Chamarajanagar', 'Chikkaballapur',
    'Chikkamagaluru', 'Chitradurga', 'Davanagere', 'Dharwad', 'Gadag', 'Hassan', 'Haveri', 'Hosapete',
    'Hubballi', 'Kalaburagi', 'Karwar', 'Kolar', 'Koppal', 'Madikeri', 'Mandya', 'Mangaluru', 'Mysuru',
    'Raichur', 'Ramanagara', 'Shivamogga', 'Tumakuru', 'Udupi', 'Vijayapura', 'Yadgir',
    # Bidar district towns
    'Aurad', 'Basavakalyan', 'Bhalki', 'Chitguppa', 'Hulsoor', 'Humnabad', 'Kamalnagar',
    # Other major towns
    'Afzalpur', 'Aland', 'Arsikere', 'Athani', 'Badami', 'Bailhongal', 'Bhadravati', 'Bhatkal',
    'Channagiri', 'Channapatna', 'Chikkodi', 'Chintamani', 'Chitapur', 'Doddaballapur', 'Gangavathi',
    'Gokak', 'Gubbi', 'Harihar', 'Hosakote', 'Hunsur', 'Ilkal', 'Jamkhandi', 'Jewargi', 'Kanakapura',
    'Kolar Gold Fields', 'Kundapura', 'Kunigal', 'Lingasugur', 'Maddur', 'Malavalli', 'Manvi',
    'Muddebihal', 'Mudhol', 'Nanjangud', 'Nippani', 'Puttur', 'Ramdurg', 'Ranebennur', 'Sakleshpur',
    'Savadatti', 'Sedam', 'Shahabad', 'Shorapur', 'Sindagi', 'Sindhanur', 'Sira', 'Sirsi', 'Tiptur',
]

LOCALITIES = {
    'Bidar': [
        'Adarsh Colony', 'Bank Colony', 'Basava Nagar', 'Halladkeri', 'Hanuman Nagar', 'Harkud',
        'Lalwadi', 'Pratap Nagar',
    ],
    'Basavakalyan': ['Nagalingeshwar Colony'],
    'Bengaluru': [
        'Banashankari', 'Bannerghatta Road', 'Basavanagudi', 'Bellandur', 'BTM Layout', 'Electronic City',
        'Frazer Town', 'HBR Layout', 'Hebbal', 'Hennur', 'HSR Layout', 'Indiranagar', 'Jayanagar',
        'JP Nagar', 'Kengeri', 'Koramangala', 'KR Puram', 'Malleshwaram', 'Marathahalli', 'Nagarbhavi',
        'Peenya', 'Rajajinagar', 'RT Nagar', 'Sarjapur Road', 'Shivajinagar', 'Ulsoor', 'Vijayanagar',
        'Whitefield', 'Yelahanka', 'Yeshwanthpur',
    ],
    'Kalaburagi': [
        'Aiwan-e-Shahi', 'Brahmpur', 'Gubbi Colony', 'Hagarga', 'Jewargi Colony', 'Kapnoor', 'Khaja Colony',
        'MB Nagar', 'Mecca Colony', 'Noor Bagh', 'Qamar Colony', 'Ring Road', 'Sedam Road', 'Shahabazar',
        'Super Market', 'Vidya Nagar',
    ],
    'Hubballi': [
        'Badami Nagar', 'Deshpande Nagar', 'Durgadbail', 'Gokul Road', 'Gopankoppa', 'Keshwapur',
        'Navanagar', 'Old Hubli', 'Unkal', 'Vidya Nagar',
    ],
    'Dharwad': ['Hebbali Road', 'Kalyan Nagar', 'Madihal', 'Malmaddi', 'Saptapur', 'Shivagiri', 'Tapovan Nagar', 'Vidyagiri'],
    'Mysuru': [
        'Alanahalli', 'Bannimantap', 'Chamundi Vihar Layout', 'Gokulam', 'Hebbal', 'Jayalakshmipuram',
        'JP Nagar', 'Kalalavadi', 'Kuvempu Nagar', 'Lakshmipuram', 'Nazarbad', 'Saraswathipuram',
        'Vidyaranyapura', 'Vijayanagar', 'Vivekananda Nagar',
    ],
    'Belagavi': ['Angol', 'Camp', 'Hindu Nagar', 'Nehru Nagar', 'Sadashiv Nagar', 'Shahapur', 'Tilakwadi', 'Vadgaon'],
    'Raichur': ['Androon Quilla', 'Eklaspur', 'Haji Colony', 'Hosalli Camp', 'Jawahar Nagar', 'Station Road'],
    'Davanagere': ['Bhagatsingh Nagar', 'MCC A Block', 'MCC B Block', 'Nittuvalli', 'PJ Extension', 'Vidya Nagar', 'Vinayaka Badavane'],
    'Mangaluru': ['Bejai', 'Bendoor', 'Falnir', 'Hampankatta', 'Kadri', 'Kankanady', 'Kodialbail', 'MG Road', 'Surathkal', 'Urwa'],
    'Shivamogga': ['Durgigudi', 'Gandhi Nagar', 'Gopala', 'Navule', 'Vinoba Nagar'],
}

# (city, locality or None, hall name, address)
HALLS = [
    # ---- Bidar ----
    ('Bidar', 'Naubad', 'Beldale Convention Hall', 'Plot 46-47, KIADB Industrial Area, Udgir Road, behind Lahoti Maruthi Showroom, Naubad, Bidar'),
    ('Bidar', 'Naubad', 'Parvati Convention Hall', 'Behind Vasantha College, Bhalki Road, Naubad, Bidar'),
    ('Bidar', 'Naubad', 'Naga Nirmala Convention Hall', 'Naubad, Bidar'),
    ('Bidar', 'Naubad', 'Swamy Eshwar Convention Hall', 'Naubad, Bidar'),
    ('Bidar', 'Gumpa', 'Shetkar Convention Hall', 'Manhalli Road, Gumpa, Bidar 585403'),
    ('Bidar', 'Gumpa', 'Jai Bhavani Function Hall', 'Manhalli Road, Zion Colony, beside Vinayak Saree Center, Gumpa, Bidar 585403'),
    ('Bidar', 'Mailoor', 'Mahesh Function Hall', 'Bardapur, Mailoor, Bidar'),
    ('Bidar', 'Mailoor', 'S R Banquet Hall', 'Gumpa Ring Road, Mailoor, Bidar'),
    ('Bidar', 'Mailoor', 'KS Garden Function Hall', 'Mailoor Ring Road, Nandi Nagar, Bidar'),
    ('Bidar', 'Mailoor', 'Green Plaza Function Hall', 'Near GNDEC, Shastri Nagar, Mailoor, Bidar'),
    ('Bidar', 'Mailoor', 'Eden Garden Function Hall', 'Opp. GLD Engineering College, Mailoor Road, Bidar'),
    ('Bidar', 'Chidri', 'Shree Function Hall', 'Chidri Road, Badruddin Colony, Bidar 585401'),
    ('Bidar', 'Chidri', 'Vishal Kalyan Mantapa', 'Chidri Road, Bidar Bazar, Bidar'),
    ('Bidar', 'Chidri', 'Keb Function Hall', 'Chidri Road, Haq Colony, Bidar'),
    ('Bidar', 'Chidri', 'Rose Garden Function Hall', 'Beside VRL Transport, Chidri Ring Road, Bidar'),
    ('Bidar', 'Chidri', 'Rabiya Palace', 'Chidri Road, Bidar'),
    ('Bidar', 'Old City', 'Moghal Garden Function Hall', 'Golekhana, near Gawan Chowk Road, Old City, Bidar 585401'),
    ('Bidar', 'Shivnagar', 'Samarth Function Hall', '19-6-303, Naubad Road, Havappa Layout, Shivnagar, Bidar'),
    ('Bidar', 'Shivnagar', 'Vaishnavi Convention Hall', 'Shivnagar, Bidar'),
    ('Bidar', 'Shivnagar', 'SRS Function Hall', 'Shivnagar, Bidar'),
    ('Bidar', 'Nawadgeri', 'Jhira Convention Hall', 'Janwada Road, Udgir Road, Nawadgeri, Bidar 585403'),
    ('Bidar', 'Halladkeri', 'S K Function Hall', 'Behind Dargah Hazrat Khwaja Abul Faiz, Faizpura, Halladkeri, Bidar 585401'),
    ('Bidar', 'Halladkeri', 'Jagadamba Kalyana Mantap', 'Near New Bhavani Mandir, Halladkeri, Bidar'),
    ('Bidar', 'Adarsh Colony', 'Vishal Function Hall', 'SH 15, Adarsh Colony, Bidar 585401'),
    ('Bidar', 'Basava Nagar', 'Patil Function Hall', 'Manhalli Road, Basava Nagar, Bidar'),
    ('Bidar', 'Basava Nagar', 'Khushi Function Hall', 'Manhalli Road, Basava Nagar, Bidar'),
    ('Bidar', 'Bank Colony', 'Sri Sai Pushpanjali Kalyan Mantap', 'Bank Colony, Bidar'),
    ('Bidar', 'Hanuman Nagar', 'Salam Function Palace', 'Ring Road, Hanuman Nagar, Bidar'),
    ('Bidar', 'Pratap Nagar', 'Patne Function Hall', 'Near Kiran Udyog, Pratap Nagar, Udgir Road, Bidar 585403'),
    ('Bidar', 'Lalwadi', 'Royal Function Palace', 'Kumbarwada Road, Channabasav Nagar, Lalwadi, Bidar 585401'),
    ('Bidar', None, 'Izzah King Palace', 'Bidar'),
    ('Bidar', None, 'Zain Palace Function Hall', 'Bidar'),
    # ---- Basavakalyan / Humnabad ----
    ('Basavakalyan', None, 'Varsha Palace Function Hall', 'Basavakalyan, Bidar district'),
    ('Basavakalyan', None, 'Watan Function Hall', 'Basavakalyan, Bidar district'),
    ('Basavakalyan', 'Nagalingeshwar Colony', 'Sahil Function Hall', 'Nagalingeshwar Colony, Basavakalyan'),
    ('Humnabad', None, 'Super Function Hall', 'Humnabad 585330'),
    # ---- Kalaburagi ----
    ('Kalaburagi', 'Kapnoor', 'KM Function Hall', 'Sawlehat Road, Kapnoor, Kalaburagi 585104'),
    ('Kalaburagi', 'Ring Road', 'Shadaab Function Hall', 'Hagarga Cross, Ring Road, Kalaburagi 585104'),
    ('Kalaburagi', 'Mecca Colony', 'M Mehboob Function Hall', 'Mecca Colony, near Saadat Function Hall, Kalaburagi 585107'),
    ('Kalaburagi', 'Mecca Colony', 'Saadat Function Hall', 'Mecca Colony, Kalaburagi'),
    ('Kalaburagi', 'Qamar Colony', 'Bombay Function Hall', 'Qamar Colony, Kalaburagi 585104'),
    ('Kalaburagi', 'Khaja Colony', 'Faisal Function Hall', '2236 Quader Colony, Khaja Colony, Kalaburagi 585104'),
    ('Kalaburagi', 'Gubbi Colony', 'Ahmed Function Hall', 'Ring Road, Gubbi Colony, Kalaburagi 585104'),
    ('Kalaburagi', 'Noor Bagh', 'Paradise Function Hall', 'Noor Bagh, Kalaburagi 585104'),
    # ---- Hubballi / Dharwad ----
    ('Hubballi', 'Badami Nagar', 'SSK Sri Thulajabhavani Kalyana Mantapa', '2/B, Shabarinagar Road, Badami Nagar, Hubballi 580023'),
    ('Hubballi', 'Vidya Nagar', 'Vishwanath Kalyan Mantap', 'Adyapak Nagar, near Lions School, Vidya Nagar, Hubballi 580032'),
    ('Hubballi', 'Durgadbail', 'Sri Basava Kalyana Mantapa', 'Durgadbail, Hubballi 580028'),
    ('Dharwad', 'Tapovan Nagar', 'Magdum Anand Kalyan Mantap', 'Haliyal Road, Tapovan Nagar, Dharwad'),
    ('Dharwad', 'Madihal', 'Hanumanthappa Gaikwad Kalyan Mantap', 'Adhishakti Nagar, near Murghamath, Madihal, Dharwad 580006'),
    ('Dharwad', 'Hebbali Road', 'Shri Channabasava Tayavvanavar Kalyan Mantap', 'Hebbali Road, near Ayyappa Swamy Temple, Dharwad 580001'),
    # ---- Mysuru ----
    ('Mysuru', 'Vidyaranyapura', 'Om Sri Kalyana Mantapa', 'Vidyaranyapura, Mysuru 570008'),
    ('Mysuru', 'Vidyaranyapura', 'Chandra Vihar Kalyana Mantap', 'Vidyaranyapura, Mysuru 570008'),
    ('Mysuru', 'Vidyaranyapura', 'Yashoda Natarajan Kalyana Mantapa', 'Vidyaranyapura, Mysuru 570008'),
    ('Mysuru', 'JP Nagar', 'Govinda Krishna Kalyana Mantapa', 'C-Block, JP Nagar, Mysuru 570031'),
    ('Mysuru', 'Chamundi Vihar Layout', 'Rajgopal Rao Rashinkar Kalyana Mantapa', 'Chamundi Vihar Layout, Bannur Road, Mysuru'),
    ('Mysuru', 'Kalalavadi', 'Anugraha Kalyana Mantapa', 'Kalalavadi, near State Highway 33, Mysuru 570008'),
    ('Mysuru', 'Kuvempu Nagar', 'Jayamma Govindegowda Kalyana Mantapa', 'Udayaravi Road, Kuvempu Nagar 1st Stage, Mysuru 570023'),
    ('Mysuru', 'Bannimantap', 'Bhuvaneshwari Kalyana Mantapa', 'KSRTC Layout, HUDCO Main Road, Bannimantap, Mysuru 570015'),
    ('Mysuru', 'Jayalakshmipuram', 'Sri Dharmastala Manjunatha Swamy Kalyana Mantapa', 'Near Mahajana College, Hospital Road, Jayalakshmipuram, Mysuru 570012'),
    ('Mysuru', 'Alanahalli', 'Sri Chamundeshwari Convention Hall', 'Ring Road, Alanahalli, Mysuru 570019'),
    ('Mysuru', 'Vivekananda Nagar', 'Nagamma Kalyana Bhavan', 'Vivekananda Nagar, Mysuru 570021'),
    # ---- Raichur ----
    ('Raichur', 'Jawahar Nagar', 'Sringeri Sharada Kalyana Mantapa', 'Near Sri Guru Computers, Jawahar Nagar, Raichur 584102'),
    ('Raichur', 'Jawahar Nagar', 'Sri Sujayeendra Teertha Kalyana Mantapa', 'Near Sri Guru Computers, Jawahar Nagar, Raichur 584101'),
    ('Raichur', 'Eklaspur', 'Ark Grand Function Hall', 'Eklaspur Village Road, near Kakathiya School, Raichur 584101'),
    ('Raichur', 'Androon Quilla', 'Rajamatha Kalyana Mantapa', 'Ashapur Road, Androon Quilla, Raichur'),
    ('Raichur', 'Hosalli Camp', 'Sri Yalamanchili Vasudeva Rao Kalyana Mantapa', 'Hosalli Camp, Raichur 584128'),
    ('Raichur', 'Haji Colony', 'Royal Palace Function Hall', 'Haji Colony, Raichur 584101'),
    # ---- Belagavi ----
    ('Belagavi', 'Hindu Nagar', 'Sathya Pramoda Kalyana Mantapa', 'Near BSNL Office, Subhash Chandra Nagar, Hindu Nagar, Belagavi 590006'),
    ('Belagavi', 'Nehru Nagar', 'KPTCL Samudaya Bhavan Kalyana Mantapa', 'Shakthi Marg, KPTCL Colony, Nehru Nagar, Belagavi 590010'),
    # ---- Davanagere ----
    ('Davanagere', 'MCC B Block', 'S.S. Convention Hall', '3993/47, Shamanur Road, MCC B Block, Kuvempu Nagar, Davanagere 577004'),
    ('Davanagere', 'Vinayaka Badavane', 'Shivagange Convention Center', 'Kundavada Road, Vinayaka Badavane, Davanagere 577004'),
    ('Davanagere', 'Bhagatsingh Nagar', 'Pampapathi Function Hall', 'Main Road, Bhagatsingh Nagar, Davanagere'),
    # ---- Shivamogga / Mangaluru / Bengaluru ----
    ('Shivamogga', 'Navule', 'Sarji Convention Hall', 'Savalanga Road, next to Vijay Karnataka Press, Navule, Shivamogga 577201'),
    ('Mangaluru', 'MG Road', 'TMA Pai International Convention Centre', 'MG Road, Mangaluru'),
    ('Mangaluru', 'Hampankatta', 'Town Hall Mangaluru', 'Hampankatta, Mangaluru'),
    ('Bengaluru', 'Jayanagar', 'Sri Sai Convention Hall', '40th Cross Road, Jayanagar T Block, Bengaluru 560041'),
    ('Bengaluru', 'Whitefield', 'KMM Royal Convention Centre', 'Hoskote-Whitefield Road, Katamnallur, Bengaluru 560049'),
]

IMPORT_NOTE = 'Imported from public listings (Justdial / Yappe / Mandap.com / WedMeGood / Mappls), Nov 2026.'


def seed(apps, schema_editor):
    Country = apps.get_model('locations', 'Country')
    State = apps.get_model('locations', 'State')
    City = apps.get_model('locations', 'City')
    Locality = apps.get_model('locations', 'Locality')
    Venue = apps.get_model('locations', 'Venue')

    # Only Home and Function / Convention Hall remain as venue types.
    Venue.objects.exclude(category='FUNCTION_HALL').update(category='FUNCTION_HALL')

    india, _ = Country.objects.get_or_create(name='India', defaults={'iso_code': 'IN'})
    karnataka, _ = State.objects.get_or_create(country=india, name='Karnataka')
    cities = {name: City.objects.get_or_create(state=karnataka, name=name)[0] for name in KARNATAKA_CITIES}

    def locality(city_name, name):
        return Locality.objects.get_or_create(city=cities[city_name], name=name, defaults={'data_source': 'SEED'})[0]

    for city_name, names in LOCALITIES.items():
        for name in names:
            locality(city_name, name)

    now = timezone.now()
    for city_name, loc_name, name, address in HALLS:
        city = cities[city_name]
        if Venue.objects.filter(city=city, name__iexact=name).exists():
            continue
        Venue.objects.create(
            name=name,
            category='FUNCTION_HALL',
            city=city,
            locality=locality(city_name, loc_name) if loc_name else None,
            full_address=address,
            verification_status='VERIFIED',
            is_active=True,
            data_source='IMPORT',
            last_verified_at=now,
            admin_notes=IMPORT_NOTE,
        )


class Migration(migrations.Migration):
    dependencies = [('locations', '0003_venue_types_home_function_hall')]
    operations = [migrations.RunPython(seed, migrations.RunPython.noop)]
