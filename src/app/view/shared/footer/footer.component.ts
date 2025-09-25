import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: ` <footer>
    <div class="footer">
      <!-- <div class=" titulo d-flex align-items-center justify-content-center">
        <div >
          <h1>Sistema Comercial</h1>
        </div>
        <div>
          <p>
            Lorem ipsum, dolor sit amet consectetur adipisicing elit. Nemo
            reiciendis maiores, culpa minima natus rerum, odio autem adipisci quia
            soluta ab, minus accusamus! Itaque optio quidem dolore minima facere
            unde.
          </p>
        </div>
      </div> -->

      <div class="row">
        <h5>Sistema Comercial:</h5>
        <p>Descubre la calidad y variedad de nuestros productos comerciales, seleccionados con el mayor cuidado para ofrecerte la mejor experiencia de compra.</p>
      </div>

      <div class="text-center">
        Sistema Comercial Copyright © 2025 - Derechos reservados || Grupo 6 Calidad de Software
      </div>
    </div>
  </footer>`,
  styleUrl: './footer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {}
