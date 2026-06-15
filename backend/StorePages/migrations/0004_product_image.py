from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('StorePages', '0003_product'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='image',
            field=models.ImageField(blank=True, null=True, upload_to='product_images/'),
        ),
    ]
